const gulp = require('gulp');
const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const buffer = require('vinyl-buffer');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');
const rollupHelper = require('./utils/rollup-helper');

const ERROR_NO_BROWSER_BUNDLE = `Could not find the browser bundle: `;
const ERROR_NO_NAMSPACE = oneLine`
  You must define a 'browserNamespace' parameter in the 'package.json'.
  Exmaple: 'workbox-precaching' would have a browserNamespace param of
  'precaching' in 'package.json'. This will be appended to
  '${constants.NAMESPACE_PREFIX}' meaning developers would use
  '${constants.NAMESPACE_PREFIX}.precaching' in their
  JavaScript. Please fix for:
`;

/**
 * This function takes an object like { nested: { foo: bar } } and a string
 * like `nested.foo` and returns true if that value is defined on the obejct.
 */
const testObjectValueExists = (object, nestedPath) => {
  const pieces = nestedPath.split('.');
  let currentRoot = object;
  for (const piece of pieces) {
    if (!currentRoot[piece]) {
      return false;
    }
    currentRoot = currentRoot[piece];
  }
  return true;
};

/**
 * To test sourcemaps are valid and working, use:
 * http://paulirish.github.io/source-map-visualization/#custom-choose
 */

const buildPackage = (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const browserEntryPath = path.join(
    packagePath,
    constants.PACKAGE_BUILD_DIRNAME,
    constants.BROWSER_ENTRY_FILENAME);

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.pathExistsSync(browserEntryPath)) {
    logHelper.error(ERROR_NO_BROWSER_BUNDLE + packageName);
    return Promise.reject(ERROR_NO_BROWSER_BUNDLE + packageName);
  }

  const pkgJson = require(path.join(packagePath, 'package.json'));
  if (!pkgJson.workbox || !pkgJson.workbox.browserNamespace) {
    logHelper.error(ERROR_NO_NAMSPACE + ' ' + packageName);
    return Promise.reject(ERROR_NO_NAMSPACE + ' ' + packageName);
  }

  // Filename should be format <package name>.<build type>.js
  const outputFilename = `${packageName}.${buildType}.js`;
  // Namespace should be <name space>.<modules browser namespace>
  const namespace =
    `${constants.NAMESPACE_PREFIX}.${pkgJson.workbox.browserNamespace}`;

  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(packageName)}.
  `);
  logHelper.log(`    Namespace: ${logHelper.highlight(namespace)}`);
  logHelper.log(`    Filename: ${logHelper.highlight(outputFilename)}`);

  const plugins = rollupHelper.getDefaultPlugins(buildType);

  // This makes Rollup assume workbox-* will be added to the global
  // scope and replace references with the core namespace
  const globals = (moduleId) => {
    // This regex matches for (workbox-*)(/any/path/here.mjs)
    const workboxModuleIdRegex = /(workbox-\w*)([/\w.]*)*/g;
    const result = workboxModuleIdRegex.exec(moduleId);
    if (!result) {
      throw new Error(`Unknown global module ID: ${moduleId}`);
    }

    const packageName = result[1];
    let importFilePath = null;
    if (result.length === 3) {
      importFilePath = result[2];
      if (importFilePath && importFilePath.indexOf('/') === 0) {
        importFilePath = importFilePath.replace('/', '');
      }
    }

    // Get a package's browserNamespace so we know where it will be
    // on the global scope (i.e. google.workbox.????)
    let browserNamespace = null;
    const packagePath = path.join(__dirname, '..', 'packages', packageName);
    try {
      const pkg = require(path.join(packagePath, 'package.json'));
      browserNamespace = pkg.workbox.browserNamespace;
    } catch (err) {
      logHelper.error(`Unable to get browserNamespace for package: ` +
        `'${packageName}'`);
      logHelper.error(err);
      throw err;
    }

    let globalNamespace = `${constants.NAMESPACE_PREFIX}.${browserNamespace}`;
    let fileNamespace = '';
    // If a module pulls in a specific file the namespace will need to
    // include this information. i.e. workbox-core/internal/logHelper should
    // become google.workbox.core.internal.logHelper
    if (importFilePath) {
      // Glob for the file we want so that file extensions are automatically
      // searched for.
      // This is just to ensure a file is there.
      const matchingFiles = glob.sync(
        path.join(packagePath, importFilePath + '*'));

      // If we have no matches or multiple matches, we can't be sure what
      // the import should be, so error out as it's ambiguous.
      if (matchingFiles.length !== 1) {
        logHelper.error(
          `Expect a single file when searching for '${moduleId}': `,
          matchingFiles);
        throw new Error('Unexpected result when looking for appropriate file ' +
          `to match ${moduleId}`);
      }

      // Strip any file extensions
      importFilePath = importFilePath.replace(path.extname(importFilePath), '');

      // Replace all forward slashes with a dot
      fileNamespace = importFilePath.replace(/\//g, '.');
    }

    // To further ensure exports and imports are where they are expect,
    // we could test the generated browser export to ensure our new global
    // module is correct.
    const browserEntryDetails = getBrowserExports(packagePath);
    const exports = browserEntryDetails.exports;

    const expectedExportName = fileNamespace ? fileNamespace : 'default';
    if (!testObjectValueExists(exports, expectedExportName)) {
      logHelper.warn(`Unable to find the browser namespace for imported ` +
        `module`);
      logHelper.warn(`Imported Module ID: '${moduleId}'`);
      logHelper.warn(`Looking at package: '${packagePath}'`);
      logHelper.warn(`Expected Export Name: '${expectedExportName}'`);
      logHelper.warn(`Known exports from this package:\n` +
        `${JSON.stringify(browserEntryDetails.exports, null, 2)}`);
      throw new Error(`Unable to find a valid replacement for module: ` +
        `'${moduleId}'`);
    }

    const finalNamespace = fileNamespace ?
      `${globalNamespace}.${fileNamespace}` :
      globalNamespace;
    logHelper.log(`Swapping import '${moduleId}' for '${finalNamespace}'`);
    return finalNamespace;
  };

  // This ensures all workbox-* modules are treated as external.
  const external = (moduleId) => {
    return (moduleId.indexOf('workbox-') === 0);
  };

  return rollup({
    entry: browserEntryPath,
    format: 'iife',
    moduleName: namespace,
    sourceMap: true,
    globals,
    external,
    plugins,
    onwarn: (warning) => {
      // The final builds should have no warnings.
      logHelper.error(`Unable to resolve import. `, warning.message);
      throw new Error(`Unable to resolve import. ${warning.message}`);
    },
  })
  // We must give the generated stream the same name as the entry file
  // for the sourcemaps to work correctly
  .pipe(source(browserEntryPath))
  // gulp-sourcemaps don't work with streams so we need
  .pipe(buffer())
  // This tells gulp-sourcemaps to load the inline sourcemap
  .pipe(sourcemaps.init({loadMaps: true}))
  // This renames the output file
  .pipe(rename(outputFilename))
  // This writes the sourcemap alongside the final build file
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(outputDirectory));
};

const cleanPackages = (packagePath) => {
  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);
  return fs.remove(outputDirectory);
};

gulp.task('build-packages:clean', gulp.series(
  packageRunnner('build-packages:clean', cleanPackages)
));

// This will create one version of the tests for each buildType.
// i.e. we'll have a browser build for no NODE_ENV and one for 'prod'
// NODE_ENV and the same for sw and node tests.
const packageBuilds = constants.BUILD_TYPES.map((buildType) => {
  return packageRunnner('build-package', buildPackage, buildType);
});

gulp.task('build-packages:build', gulp.series(packageBuilds));

/**
 * This function will take an object and generate a friend export
 * object.
 * For example, { hello: world, example: { foo: foo } } will output:
 * "{
 *   hello: world,
 *   example: {
 *     foo,
 *   },
 * }"
 * @param {*} exportObject This is the object that needs to be converted
 * to a string.
 * @param {*} levels This value is just used for indenting the code to
 * ensure the final output is human readable and easy to understand.
 */
const convertExportObject = (exportObject, levels = 0) => {
  let outputStrings = [];
  const keys = Object.keys(exportObject);
  keys.forEach((key) => {
    const value = exportObject[key];
    if (typeof(value) === 'string') {
      if (key === value) {
        outputStrings.push(`${value}`);
      } else {
        outputStrings.push(`${key}: ${value}`);
      }
    } else {
      const valueString = convertExportObject(value, levels + 1);
      outputStrings.push(`${key}: ${valueString}`);
    }
  });
  const padding = '  '.repeat(levels + 1);
  const closePadding = '  '.repeat(levels);
  const joinString = `,\n${padding}`;
  return `{\n${padding}${outputStrings.join(joinString)}\n${closePadding}}`;
};

const getBrowserExports = (pkgPath) => {
  let browserEntryExport = {};
  let browserEntryImports = {};

  const filesToPublish = glob.sync(path.posix.join(pkgPath, '**', '*.mjs'));
  filesToPublish.forEach((importPath) => {
    // This will prevent files starting with '_' from
    // being included in the browser bundle. This should
    // only be used in very rare cases. See
    // workbox-core/internal/models/messages/ for example
    // where the file shouldn't be included in browser
    // bundle.
    if (path.basename(importPath).indexOf('_') === 0) {
      return;
    }

    const pkgRelativePath = path.relative(pkgPath, importPath);
    let exportName = path.basename(importPath, '.mjs');
    let isDefault = false;
    if (pkgRelativePath === 'index.mjs') {
      // This is the default module export
      exportName = 'modulesDefaultExport';
      isDefault = true;
    }

    browserEntryImports[exportName] = importPath;

    if (isDefault) {
      browserEntryExport.default = exportName;
    } else {
      let currentObject = browserEntryExport;
      path.dirname(pkgRelativePath).split(path.sep).forEach((pathSection) => {
        if (!currentObject[pathSection]) {
          currentObject[pathSection] = {};
        }
        currentObject = currentObject[pathSection];
      });
      currentObject[exportName] = exportName;
    }
  });

  return {
    imports: browserEntryImports,
    exports: browserEntryExport,
  };
};

/**
 * This function will generate a file containing all the imports and exports
 * for a package. This file will then be passed to Rollup as the "entry" file
 * to generate the 'iife' browser bundle.
 */
const generateBrowserEntryFile = (pkgPath) => {
  const outputPath = path.join(pkgPath, constants.PACKAGE_BUILD_DIRNAME,
    constants.BROWSER_ENTRY_FILENAME);

  let browserEntryFileContents = ``;
  const browserEntryDetails = getBrowserExports(pkgPath);
  Object.keys(browserEntryDetails.imports).forEach((importKey) => {
    const entryRelativePath = path.relative(
      path.dirname(outputPath), browserEntryDetails.imports[importKey]);
  browserEntryFileContents +=
    `import ${importKey} from '${entryRelativePath}';\n`;
  });

  const exportObjectString = convertExportObject(browserEntryDetails.exports);
  browserEntryFileContents += `\nexport default ${exportObjectString}`;

  fs.ensureDirSync(path.dirname(outputPath));
  return fs.writeFile(outputPath, browserEntryFileContents);
};

gulp.task('build-packages:generate-browser-entry', gulp.series(
  packageRunnner(
    'build-packages:generate-browser-entry',
    generateBrowserEntryFile,
  )
));

gulp.task('build-packages', gulp.series([
  'build-packages:clean',
  'build-packages:generate-browser-entry',
  'build-packages:build',
]));

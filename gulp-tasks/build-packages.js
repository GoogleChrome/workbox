const gulp = require('gulp');
const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const rollupStream = require('rollup-stream');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const buffer = require('vinyl-buffer');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');
const rollupHelper = require('./utils/rollup-helper');

/*
 * To test sourcemaps are valid and working, use:
 * http://paulirish.github.io/source-map-visualization/#custom-choose
 */

const ERROR_NO_MODULE_INDEX = `Could not find the modules index.mjs file: `;
const ERROR_NO_NAMSPACE = oneLine`
  You must define a 'browserNamespace' parameter in the 'package.json'.
  Exmaple: 'workbox-precaching' would have a browserNamespace param of
  'precaching' in 'package.json'. This will be appended to
  '${constants.NAMESPACE_PREFIX}' meaning developers would use
  '${constants.NAMESPACE_PREFIX}.precaching' in their
  JavaScript. Please fix for:
`;

// This makes Rollup assume workbox-* will be added to the global
// scope and replace references with the core namespace
const globals = (moduleId) => {
  const splitModuleId = moduleId.split('/');
  if (splitModuleId[0].indexOf('workbox-') !== 0) {
    throw new Error(`Unknown global module ID: ${moduleId}`);
  }

  const packageName = splitModuleId.shift();
  if (splitModuleId.length > 0) {
    throw new Error(oneLine`
    All imports of workbox-* modules must be done from the top level export.
    (i.e. import * from 'workbox-*') This ensures that the browser
    namespacing works correctly. Please remove '${splitModuleId.join('/')}'
    from the import '${moduleId}'.
  `);
  }

  // Get a package's browserNamespace so we know where it will be
  // on the global scope (i.e. workbox.<name space>)
  const packagePath = path.join(__dirname, '..', 'packages', packageName);
  try {
    const pkg = require(path.join(packagePath, 'package.json'));
    return `${constants.NAMESPACE_PREFIX}.${pkg.workbox.browserNamespace}`;
  } catch (err) {
    logHelper.error(`Unable to get browserNamespace for package: ` +
      `'${packageName}'`);
    logHelper.error(err);
    throw err;
  }
};

// This ensures all workbox-* modules are treated as external and are
// referenced as globals.
const externalAndPure = (moduleId) => (moduleId.indexOf('workbox-') === 0);

const buildPackage = (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const moduleIndexPath = path.join(packagePath, `index.mjs`);

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.pathExistsSync(moduleIndexPath)) {
    logHelper.error(ERROR_NO_MODULE_INDEX + packageName);
    return Promise.reject(ERROR_NO_MODULE_INDEX + packageName);
  }

  const pkgJson = require(path.join(packagePath, 'package.json'));
  if (!pkgJson.workbox || !pkgJson.workbox.browserNamespace) {
    logHelper.error(ERROR_NO_NAMSPACE + ' ' + packageName);
    return Promise.reject(ERROR_NO_NAMSPACE + ' ' + packageName);
  }

  const namespace =
    `${constants.NAMESPACE_PREFIX}.${pkgJson.workbox.browserNamespace}`;
  const outputFilename = `${packageName}.${buildType}.js`;
  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(packageName)}.
  `);
  logHelper.log(`    Namespace: ${logHelper.highlight(namespace)}`);
  logHelper.log(`    Filename: ${logHelper.highlight(outputFilename)}`);

  return rollupStream({
    entry: moduleIndexPath,
    format: 'iife',
    moduleName: namespace,
    sourceMap: true,
    exports: 'named',
    globals,
    external: externalAndPure,
    pureExternalModules: externalAndPure,
    plugins: rollupHelper.getDefaultPlugins(buildType),
    onwarn: (warning) => {
      if (buildType === 'prod' && warning.code === 'UNUSED_EXTERNAL_IMPORT') {
        // This can occur when using rollup-plugin-replace.
        logHelper.warn(`[${warning.code}] ${warning.message}`);
        return;
      }

      // The final builds should have no warnings.
      throw new Error(`Unhandled Rollup Warning: [${warning.code}] ` +
        `'${warning.message}'`);
    },
  })
  .on('error', (err) => {
    const args = [];
    Object.keys(err).forEach((key) => {
      args.push(`${key}: ${err[key]}`);
    });
    logHelper.error(err, `\n\n${args.join('\n')}`);
    throw err;
  })
  // We must give the generated stream the same name as the entry file
  // for the sourcemaps to work correctly
  .pipe(source(moduleIndexPath))
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

/*
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

  const filesToPublish = glob.sync(path.posix.join(pkgPath, '**', '*.mjs'), {
    // Modules depending on other workbox-* modules will have their .mjs
    // files included when we don't want them to.
    ignore: [
      '**/node_modules/**/*',
    ],
  });
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

/*
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

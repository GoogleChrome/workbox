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

/**
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

 // Ensure all workbox-* modules are treated as external
const handleRollupExternal = (moduleId) => (moduleId.indexOf('workbox-') === 0);
const handleRollupGlobal = (moduleId) => {
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
    }

    if (importFilePath) {
      throw new Error(oneLine`
        All imports of workbox-* modules must be done from the top level export.
        (i.e. import * from 'workbox-*') This ensures that the browser
        namespacing works correctly. Please remove '${importFilePath}' from
        the import '${moduleId}'.
      `);
    }

    // Get a package's browserNamespace so we know where it will be
    // on the global scope (i.e. workbox.????)
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

    return browserNamespace;
};

const buildPackage = (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const moduleIndexPath = path.join(packagePath, `index.mjs`);

  if (!fs.pathExistsSync(moduleIndexPath)) {
    logHelper.error(ERROR_NO_MODULE_INDEX + packageName);
    return Promise.reject(ERROR_NO_MODULE_INDEX + packageName);
  }

  const pkgJson = require(path.join(packagePath, 'package.json'));
  if (!pkgJson.workbox || !pkgJson.workbox.browserNamespace) {
    logHelper.error(ERROR_NO_NAMSPACE + ' ' + packageName);
    return Promise.reject(ERROR_NO_NAMSPACE + ' ' + packageName);
  }

  const outputFilename = `${packageName}.${buildType}.js`;
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

  return rollup({
    entry: moduleIndexPath,
    format: 'iife',
    exports: 'named',
    moduleName: namespace,
    sourceMap: true,
    globals: handleRollupGlobal,
    external: handleRollupExternal,
    plugins: rollupHelper.getDefaultPlugins(buildType),
    onwarn: (warning) => {
      if (buildType === 'prod' && warning.code === 'UNUSED_EXTERNAL_IMPORT') {
        // This can occur when using rollup-plugin-replace.
        logHelper.warn(`[${warning.code}] ${warning.message}`);
        return;
      }

      // The final builds should have no warnings.
      logHelper.error(`Unhandled Rollup Warning: [${warning.code}] `,
        warning.message);
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

gulp.task('build-packages', gulp.series([
  'build-packages:clean',
  'build-packages:build',
]));

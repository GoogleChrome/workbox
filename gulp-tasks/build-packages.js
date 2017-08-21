const gulp = require('gulp');
const path = require('path');
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
 * To test sourcemaps are valid and working, use:
 * http://paulirish.github.io/source-map-visualization/#custom-choose
 */

const buildPackage = (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const browserBundlePath = path.join(packagePath, 'browser.mjs');

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.pathExistsSync(browserBundlePath)) {
    logHelper.error(ERROR_NO_BROWSER_BUNDLE + packageName);
    return Promise.reject(ERROR_NO_BROWSER_BUNDLE + packageName);
  }

  const pkgJson = require(path.join(packagePath, 'package.json'));
  if (!pkgJson['workbox::browserNamespace']) {
    logHelper.error(ERROR_NO_NAMSPACE + packageName);
    return Promise.reject(ERROR_NO_NAMSPACE + packageName);
  }

  // Filename should be format <package name>.<build type>.js
  const outputFilename = `${packageName}.${buildType}.js`;
  // Namespace should be <name space>.<modules browser namespace>
  const namespace =
    `${constants.NAMESPACE_PREFIX}.${pkgJson['workbox::browserNamespace']}`;

  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(packageName)}.
  `);
  logHelper.log(`    Namespace: ${logHelper.highlight(namespace)}`);
  logHelper.log(`    Filename: ${logHelper.highlight(outputFilename)}`);

  const plugins = rollupHelper.getDefaultPlugins(buildType);

  // This makes Rollup assume workbox-core will be added to the global
  // scope and replace references with the core namespace
  const globals = {
    'workbox-core': `${constants.NAMESPACE_PREFIX}.core`,
  };
  const external = [
    'workbox-core',
  ];

  return rollup({
    entry: browserBundlePath,
    format: 'iife',
    moduleName: namespace,
    sourceMap: true,
    // Treat export defaults as <namespace>.default
    exports: 'named',
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
  .pipe(source(browserBundlePath))
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
const packageBuilds =constants.BUILD_TYPES.map((buildType) => {
  return packageRunnner('build-package', buildPackage, buildType);
});

gulp.task('build-packages:build', gulp.series(packageBuilds));

gulp.task('build-packages', gulp.series([
  'build-packages:clean',
  'build-packages:build',
]));

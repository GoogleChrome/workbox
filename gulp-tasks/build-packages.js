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

/**
 * To test sourcemaps are valid and working, use:
 * http://paulirish.github.io/source-map-visualization/#custom-choose
 */

const buildPackage = (packagePath, buildType) => {
  const srcPath = path.join(packagePath, 'src');
  const browserBundlePath = path.join(srcPath, 'browser-bundle.js');

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.pathExistsSync(browserBundlePath)) {
    const errorMsg = oneLine`
      Could not find the browser bundle for ${pkgPathToName(packagePath)}.
    `;
    logHelper.error(errorMsg);
    return Promise.reject(errorMsg);
  }

  const pkgJson = require(path.join(packagePath, 'package.json'));
  if (!pkgJson.browserNamespace) {
    const errorMsg = oneLine`
      You must define a 'browserNamespace' parameter in the 'package.json'
      for ${pkgPathToName(packagePath)}. Exmaple: 'workbox-precaching'
      would have a browserNamespace of 'precaching', which will be
      appended to 'google.workbox' meaning developers would use
      'google.workbox.precaching' in their JavaScript.
    `;
    logHelper.error(errorMsg);
    return Promise.reject(errorMsg);
  }

  const buildName = typeof buildType === 'undefined' ? 'dev' : buildType;
  const outputFilename = `${pkgPathToName(packagePath)}.${buildName}.js`;
  const namespace = `google.workbox.${pkgJson.browserNamespace}`;

  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);
  logHelper.log(`    Namespace: ${logHelper.highlight(namespace)}`);
  logHelper.log(`    Filename: ${logHelper.highlight(outputFilename)}`);

  const plugins = rollupHelper.getDefaultPlugins(buildType);

  return rollup({
    entry: browserBundlePath,
    format: 'iife',
    moduleName: namespace,
    sourceMap: true,
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
// i.e. we'll have a browser build for no NODE_ENV and one for 'production'
// NODE_ENV and the same for sw and node tests.
const packageBuilds =constants.BUILD_TYPES.map((buildType) => {
  return packageRunnner('build-package', buildPackage, buildType);
});

gulp.task('build-packages:build', gulp.series(packageBuilds));

gulp.task('build-packages', gulp.series([
  'build-packages:clean',
  'build-packages:build',
]));

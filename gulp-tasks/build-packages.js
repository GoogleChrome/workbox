const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const replace = require('rollup-plugin-replace');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const buffer = require('vinyl-buffer');
const babili = require('rollup-plugin-babili');
const compiler = require('google-closure-compiler-js').gulp();

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');

/**
 * To test sourcemaps are valid and working, use:
 * http://paulirish.github.io/source-map-visualization/#custom-choose
 */

const buildPackage = (packagePath, buildType) => {
  const srcPath = path.posix.join(packagePath, 'src');
  const browserBundlePath = path.posix.join(srcPath, 'browser-bundle.js');

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.pathExistsSync(browserBundlePath)) {
    const errorMsg = oneLine`
      Could not find the browser bundle for ${pkgPathToName(packagePath)}.
    `;
    logHelper.error(errorMsg);
    return Promise.reject(errorMsg);
  }

  const buildName = typeof buildType === 'undefined' ? 'dev' : buildType;
  let outputFilename = `${pkgPathToName(packagePath)}.${buildName}.js`;

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

  const namespace = `google.workbox.${pkgJson.browserNamespace}`;

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);
  logHelper.log(`    Namespace: ${logHelper.highlight(namespace)}`);
  logHelper.log(`    Filename: ${logHelper.highlight(outputFilename)}`);

  const plugins = [
    //
    // !!! ATTENTION !!!
    //
    // Before adding a plugin, give serious consideration as to whether it
    // is the best option. It will complicate the build and could have
    // adverse affects on file size.
    babili({
      // Remove comments from source code.
      comments: false,
    }),
  ];

  if (buildType) {
    // Replace allows us to input NODE_ENV and strip code accordingly
    plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(buildType),
    }));
  }

  const outputPath = path.join(
    packagePath, constants.BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);

  const relOutputPath = path.relative(packagePath, outputPath);
  if (!pkgJson.main || path.dirname(pkgJson.main) !== relOutputPath) {
    const errorMsg = oneLine`
      You must define a 'main' parameter in the 'package.json'
      for ${pkgPathToName(packagePath)} which points to a build
      file in the directory '${relOutputPath}'.
    `;
    logHelper.error(errorMsg);
    return Promise.reject(errorMsg);
  }

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
  .pipe(gulp.dest(outputPath));
};

const cleanPackages = (packagePath) => {
  const browserBuildDirectory = path.join(
    packagePath, constants.BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);
  return fs.remove(browserBuildDirectory);
};

gulp.task('build-packages:clean', gulp.series(
  packageRunnner('build-packages:clean', cleanPackages)
));

// This will create one version of the tests for each buildType.
// i.e. we'll have a browser build for no NODE_ENV and one for 'production'
// NODE_ENV and the same for sw and node tests.
const packageBuilds = [];
constants.BUILD_TYPES.forEach((buildType) => {
  packageBuilds.push(
    packageRunnner('build-package', buildPackage, buildType)
  );
});

gulp.task('build-packages:build', gulp.series(packageBuilds));

gulp.task('build-packages', gulp.series([
  'build-packages:clean',
  'build-packages:build',
]));

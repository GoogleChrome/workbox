const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const replace = require('rollup-plugin-replace');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');

const buildPackage = (packagePath, buildType) => {
  const srcPath = path.posix.join(packagePath, 'src');
  const browserBundlePath = path.posix.join(srcPath, 'browser-bundle.js');

  // First check if the bundle directory exists, if it doesn't
  // there is nothing to build (NOTE: Rollup + multientry will
  // always create a file, even if the directory doesn't exist)
  if (!fs.pathExistsSync(browserBundlePath)) {
    const errorMsg = oneLine`
      Could not find the browser bundle for ${pkgPathToName(packagePath)}.
    `;
    logHelper.error(errorMsg);
    return Promise.reject(errorMsg);
  }

  const plugins = [
    // No plugins are needed at present apart from the optional replace plugin.
    //
    // !!! ATTENTION !!!
    //
    // Before adding a plugin, give serious consideration as to where it
    // is the best option. It will complicate the build and could have
    // adverse affects on file size.
  ];

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

  if (buildType) {
    // Replace allows us to input NODE_ENV and strip code accordingly
    plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(buildType),
    }));
  }

  const outputPath = path.join(
    packagePath, constants.BUILD_DIRNAME, 'browser-bundles');

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
  // This gives the generated stream a file name
  .pipe(source(outputFilename))
  .pipe(gulp.dest(outputPath));
};

// This will create one version of the tests for each buildType.
// i.e. we'll have a browser build for no NODE_ENV and one for 'production'
// NODE_ENV and the same for sw and node tests.
const packageBuilds = [];
constants.BUILD_TYPES.forEach((buildType) => {
  packageBuilds.push(
    packageRunnner('build-package', buildPackage, buildType)
  );
});

gulp.task('build-package', gulp.series(packageBuilds));

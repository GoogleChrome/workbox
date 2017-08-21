const path = require('path-extra');
const gulp = require('gulp');
const fs = require('fs-extra');
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const multiEntry = require('rollup-plugin-multi-entry');
const istanbul = require('rollup-plugin-istanbul');
const oneLine = require('common-tags').oneLine;

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');
const rollupHelper = require('./utils/rollup-helper');

const buildTestBundle = (packagePath, runningEnv, buildType) => {
  const testPath = path.join('test', pkgPathToName(packagePath));
  const environmentPath = path.posix.join(testPath, 'bundle', runningEnv);

  // First check if the bundle directory exists, if it doesn't
  // there is nothing to build (NOTE: Rollup + multientry will
  // always create a file, even if the directory doesn't exist)
  if (!fs.pathExistsSync(environmentPath)) {
    return Promise.resolve();
  }

  logHelper.log(oneLine`
    Building Test Bundle for ${logHelper.highlight(pkgPathToName(packagePath))}
    to run in '${logHelper.highlight(runningEnv)}'
    with NODE_ENV='${logHelper.highlight(buildType)}'.
  `);

  const plugins = rollupHelper.getDefaultPlugins(buildType);
  // Resolve allows bundled tests to pull in node modules like chai.
  plugins.push(resolve());
  // CommonJS allows the loaded modules to work as ES2015 imports.
  plugins.push(
    commonjs({
      namedExports: {
        'node_modules/chai/index.js': ['expect'],
      },
    })
  );
  // Multi entry globs for multiple files. Used to pull in all test files.
  plugins.push(multiEntry());
  // This adds code coverage to our tests
  plugins.push(istanbul({
    exclude: ['test/**/*.js', 'node_modules/**/*'],
  }));

  const outputFilename = `${runningEnv}.${buildType}.js`;

  return rollup({
    entry: path.posix.join(environmentPath, '**', '*.js'),
    format: 'iife',
    moduleName: 'workbox.tests',
    sourceMap: 'inline',
    plugins,
    onwarn: (warning) => {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        logHelper.error(`Unable to resolve import. `, warning.message);
        throw new Error(`Unable to resolve import. ${warning.message}`);
      }

      logHelper.warn(`Rollup Warning:`, warning);
    },
  })
  // This gives the generated stream a file name
  .pipe(source(outputFilename))
  .pipe(gulp.dest(
    path.posix.join(testPath, constants.TEST_BUNDLES_BUILD_DIRNAME, runningEnv)
  ));
};

const cleanBundleFile = (packagePath) => {
  const testPath = path.join('test', pkgPathToName(packagePath));
  const outputDirectory = path.join(
    testPath, constants.TEST_BUNDLES_BUILD_DIRNAME);
  return fs.remove(outputDirectory);
};

gulp.task('build-test-bundles:clean',
  gulp.series(packageRunnner('build-test-bundles:clean', cleanBundleFile))
);

// This will create one version of the tests for each buildType.
// i.e. we'll have a browser build for no NODE_ENV and one for 'prod'
// NODE_ENV and the same for sw and node tests.
const bundleBuilds = [];
constants.BUILD_TYPES.forEach((buildType) => {
  bundleBuilds.push(
    packageRunnner('build-test-bundles:build', buildTestBundle,
    'browser', buildType)
  );
  bundleBuilds.push(
    packageRunnner('build-test-bundles:build', buildTestBundle,
    'sw', buildType)
  );
  bundleBuilds.push(
    packageRunnner('build-test-bundles:build', buildTestBundle,
    'node', buildType)
  );
});

gulp.task('build-test-bundles:build', gulp.parallel(bundleBuilds));

gulp.task('build-test-bundles', gulp.series(
  'build-test-bundles:clean',
  'build-test-bundles:build',
));

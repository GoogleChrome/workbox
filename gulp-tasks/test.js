const gulp = require('gulp');
const mocha = require('gulp-spawn-mocha');
const path = require('path');
const oneLine = require('common-tags').oneLine;

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');

const runBundledTests = (packagePath, env) => {
  logHelper.log(oneLine`
    Running Test Bundles for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);

  const mochaOptions = {};
  if (global.cliOptions.grep) {
    mochaOptions.grep = global.cliOptions.grep;
  }

  const bundleTestDirectory = path.posix.join(
    packagePath, 'test', constants.TEST_BUNDLES_BUILD_DIRNAME);
  return gulp.src(
    path.posix.join(bundleTestDirectory, env, '*.js'), {read: false})
  .pipe(mocha(mochaOptions));
};

gulp.task('test:node', gulp.series(
  packageRunnner('test:node [bundled tests]', runBundledTests, 'node')
));

gulp.task('test:browser', () => {
  // TODO: This needs implementing
  return Promise.resolve();
});

gulp.task('test:sw', () => {
  // TODO: This needs implementing
  return Promise.resolve();
});

gulp.task('test', gulp.series(
  'build-test-bundles',
  'test:node',
  'test:browser',
  'test:sw',
  'lint'
));

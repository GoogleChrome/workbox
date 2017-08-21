const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const spawn = require('./utils/spawn-promise-wrapper');

// const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');

/** const runBundledTests = (packagePath, env) => {
  logHelper.log(oneLine`
    Running Test Bundles for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);

  const mochaOptions = {
    reporter: path.join(__dirname, './utils/mocha-coverage-reporter'),
  };
  if (global.cliOptions.grep) {
    mochaOptions.grep = global.cliOptions.grep;
  }

  const bundleTestDirectory = path.posix.join(
    'test', pkgPathToName(packagePath), constants.TEST_BUNDLES_BUILD_DIRNAME);
  return gulp.src(
    path.posix.join(bundleTestDirectory, env, '*.js'), {read: false})
  .pipe(mocha(mochaOptions));
};**/

const runNodeTests = (packagePath) => {
  logHelper.log(oneLine`
    Running Node Tests for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);
  return spawn('npm', ['run', 'test'])
  .catch((err) => {
    logHelper.error(err);
    throw new Error(`[Workbox Error Msg] 'gulp test' discovered errors.`);
  });
};

gulp.task('test:node', gulp.series(
  packageRunnner('test:node [bundled tests]', runNodeTests, 'node')
));

gulp.task('test', gulp.series(
  // 'build-test-bundles',
  'test:node',
  'lint'
));

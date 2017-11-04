const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const glob = require('glob');
const fse = require('fs-extra');
const path = require('path');

const spawn = require('./utils/spawn-promise-wrapper');
const getNpmCmd = require('./utils/get-npm-cmd');
const constants = require('./utils/constants');
const logHelper = require('../infra/utils/log-helper');

const runNodeTestSuite = async (testPath, nodeEnv) => {
  logHelper.log(oneLine`
    Running Node test on ${logHelper.highlight(testPath)}
    with NODE_ENV '${nodeEnv}'
  `);

  const options = [];
  if (global.cliOptions.grep) {
    options.push('--grep', global.cliOptions.grep);
  }
  const originalNodeEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = nodeEnv;
  try {
    await spawn(getNpmCmd(), ['run', 'test', '--',
      `${testPath}/**/*.{js,mjs}`,
      ...options,
    ]);
    process.env.NODE_ENV = originalNodeEnv;
  } catch (err) {
    process.env.NODE_ENV = originalNodeEnv;

    logHelper.error(err);
    throw new Error(`[Workbox Error Msg] 'gulp test-node' discovered errors.`);
  }
};

const runNodeTestsWithEnv = async (nodeEnv) => {
  const globFolders = [global.packageOrStar];
  // This means will run the package tests along with the "all" tests.
  if (global.packageOrStar !== '*') {
    globFolders.push('all');
  }
  const packagesToTest = glob.sync(`test/{${globFolders.join(',')}}/node`);
  for (const packageToTest of packagesToTest) {
    await runNodeTestSuite(packageToTest, nodeEnv);
  }
};

gulp.task('test-node:prod', gulp.series(
  () => runNodeTestsWithEnv(constants.BUILD_TYPES.prod),
));

gulp.task('test-node:dev', gulp.series(
  () => runNodeTestsWithEnv(constants.BUILD_TYPES.dev),
));

gulp.task('test-node:clean', () => {
  return fse.remove(path.join(__dirname, '..', '.nyc_output'));
});

gulp.task('test-node:coverage', () => {
  const runOptions = ['run', 'coverage-report'];
  if (global.packageOrStar !== '*') {
    runOptions.push('--');
    runOptions.push('--include');
    runOptions.push(
      path.posix.join('packages', global.packageOrStar, '**', '*')
    );
  }
  return spawn(getNpmCmd(), runOptions);
});

gulp.task('test-node', gulp.series(
  'test-node:clean',
  'test-node:dev',
  'test-node:prod',
  'test-node:coverage',
));

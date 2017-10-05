const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const glob = require('glob');
const fse = require('fs-extra');
const path = require('path');

const spawn = require('./utils/spawn-promise-wrapper');
const getNpmCmd = require('./utils/get-npm-cmd');
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
  const packagesToTest = glob.sync(`test/${global.packageOrStar}/node`);
  for (const packageToTest of packagesToTest) {
    await runNodeTestSuite(packageToTest, nodeEnv);
  }
};

gulp.task('test-node:prod', gulp.series(
  () => runNodeTestsWithEnv('production'),
));

gulp.task('test-node:dev', gulp.series(
  () => runNodeTestsWithEnv('dev'),
));

gulp.task('test-node:clean', () => {
  return fse.remove(path.join(__dirname, '..', '.nyc_output'));
});

gulp.task('test-node:coverage', () => {
  return spawn(getNpmCmd(), ['run', 'coverage-report']);
});

gulp.task('test-node', gulp.series(
  'test-node:clean',
  'test-node:dev',
  'test-node:prod',
  'test-node:coverage',
));

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

const runNodeTestsWithEnv = async (testGroup, nodeEnv) => {
  let globConfig = {
    ignore: [
      '**/all/**',
    ],
  };

  if (testGroup === 'all') {
    globConfig.ignore = [];
  }

  const packagesToTest = glob.sync(`test/${testGroup}/node`, globConfig);
  for (const packageToTest of packagesToTest) {
    await runNodeTestSuite(packageToTest, nodeEnv);
  }
};

const testNodeProd = gulp.series(
  () => runNodeTestsWithEnv(global.packageOrStar, constants.BUILD_TYPES.prod),
);
testNodeProd.displayName = 'test-node:prod';

const testNodeDev = gulp.series(
  () => runNodeTestsWithEnv(global.packageOrStar, constants.BUILD_TYPES.dev),
);
testNodeDev.displayName = 'test-node:dev';

const testNodeAll = gulp.series(
  () => runNodeTestsWithEnv('all', constants.BUILD_TYPES.prod),
);
testNodeAll.displayName = 'test-node:all';

const testNodeClean = () => {
  return fse.remove(path.join(__dirname, '..', '.nyc_output'));
};
testNodeClean.displayName = 'test-node:clean';

const testNodeCoverage = () => {
  const runOptions = ['run', 'coverage-report'];
  if (global.packageOrStar !== '*') {
    runOptions.push('--');
    runOptions.push('--include');
    runOptions.push(
      path.posix.join('packages', global.packageOrStar, '**', '*')
    );
  }
  return spawn(getNpmCmd(), runOptions);
};
testNodeCoverage.displayName = 'test-node:coverage';

const testNode = gulp.series(
  testNodeClean,
  testNodeDev,
  testNodeProd,
  testNodeAll,
  testNodeCoverage,
);
testNode.displayName = 'test-node';

module.exports = testNode;

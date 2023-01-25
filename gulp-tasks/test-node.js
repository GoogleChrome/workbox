/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const glob = require('glob');
const ol = require('common-tags').oneLine;
const upath = require('upath');

const constants = require('./utils/constants');
const logHelper = require('../infra/utils/log-helper');

async function runNodeTestSuite(testPath, nodeEnv) {
  logHelper.log(ol`Running node test on ${logHelper.highlight(testPath)}
      with NODE_ENV '${nodeEnv}'`);

  const options = [];
  if (global.cliOptions.grep) {
    options.push('--grep', global.cliOptions.grep);
  }
  const originalNodeEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = nodeEnv;
  try {
    const {stdout} = await execa(
      'nyc',
      [
        '--clean',
        'false',
        '--silent',
        'mocha',
        '--timeout',
        '60000',
        `${testPath}/**/*.{js,mjs}`,
        ...options,
      ],
      {preferLocal: true},
    );

    console.log(stdout);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
}

async function runNodeTestsWithEnv(testGroup, nodeEnv) {
  const globConfig = {
    ignore: ['**/all/**'],
  };

  if (testGroup === 'all') {
    globConfig.ignore = [];
  }

  const packagesToTest = glob.sync(`test/${testGroup}/node`, globConfig);
  for (const packageToTest of packagesToTest) {
    // Hardcode special logic for webpack v4 and v5 tests, which need to
    // be run in separate processes.
    if (packageToTest.includes('workbox-webpack-plugin')) {
      await runNodeTestSuite(`${packageToTest}/v4`, nodeEnv);
      await runNodeTestSuite(`${packageToTest}/v5`, nodeEnv);
    } else {
      await runNodeTestSuite(packageToTest, nodeEnv);
    }
  }
}

async function test_node_prod() {
  await runNodeTestsWithEnv(global.packageOrStar, constants.BUILD_TYPES.prod);
}

async function test_node_dev() {
  await runNodeTestsWithEnv(global.packageOrStar, constants.BUILD_TYPES.dev);
}

async function test_node_all() {
  await runNodeTestsWithEnv('all', constants.BUILD_TYPES.prod);
}

async function test_node_clean() {
  await fse.remove(upath.join(__dirname, '..', '.nyc_output'));
}

async function test_node_coverage() {
  const runOptions = [];
  if (global.packageOrStar !== '*') {
    runOptions.push('--include');
    runOptions.push(upath.join('packages', global.packageOrStar, '**', '*'));
  }

  const {stdout} = await execa(
    'nyc',
    ['report', '--reporter', 'lcov', '--reporter', 'text', ...runOptions],
    {preferLocal: true},
  );

  console.log(stdout);
}

module.exports = {
  test_node_all,
  test_node_coverage,
  test_node_dev,
  test_node_prod,
  test_node: series(
    test_node_clean,
    test_node_dev,
    test_node_prod,
    test_node_all,
    test_node_coverage,
  ),
};

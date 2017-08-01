/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-disable no-console */

const chalk = require('chalk');
const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');
const {taskHarness, buildJSBundle} = require('../utils/build');
const commonjs = require('rollup-plugin-commonjs');
const multiEntry = require('rollup-plugin-multi-entry');
const resolve = require('rollup-plugin-node-resolve');

const printHeading = (heading) => {
  process.stdout.write(chalk.inverse(`  ⚒  ${heading}  `));
};

const printBuildTime = (buildTime) => {
  process.stdout.write(chalk.inverse(`(${buildTime})\n`));
};

/**
 * Builds a given project.
 * @param {String} projectPath The path to a project directory.
 * @return {Promise} Resolves if building succeeds, rejects if it fails.
 */
const buildPackage = (projectPath) => {
  printHeading(`Building ${path.basename(projectPath)}`);
  const startTime = Date.now();
  const buildDir = `${projectPath}/build`;
  const projectBuildProcess = require(`${projectPath}/build.js`);

  return fse.emptyDir(buildDir)
    .then(() => projectBuildProcess())
    .then(() => buildTestBundles(projectPath))
    .then(() => {
      fse.copy(path.join(__dirname, '..', 'LICENSE'),
          path.join(projectPath, 'LICENSE'));
    })
    .then(() => printBuildTime(`${(Date.now() - startTime) / 1000}s`));
};

/**
 * Builds the browser and service worker test bundles.
 * @param {String} projectPath The path to a project directory.
 * @return {Promise} Resolves if building succeeds, rejects if it fails.
 */
const buildTestBundles = (projectPath) => {
  const getPlugins = () => [
    // multiEntry uses glob so it requires `/` separators in paths.
    multiEntry({exports: false}),
    resolve({jsnext: true, main: true, browser: true}),
    commonjs(),
  ];

  const project = path.basename(projectPath);

  return Promise.all([
    buildJSBundle({
      rollupConfig: {
        entry: `./packages/${project}/test/browser/*.js`,
        plugins: getPlugins(),
      },
      writeConfig: {
        sourceMap: true,
        format: 'es',
        dest: `./packages/${project}/build/test/browser-bundle.js`,
      },
    }),
    buildJSBundle({
      rollupConfig: {
        entry: [
          `./utils/sw-test-utils.js`,
          `./packages/${project}/test/sw/*.js`,
        ],
        plugins: getPlugins(),
      },
      writeConfig: {
        sourceMap: true,
        format: 'es',
        dest: `./packages/${project}/build/test/sw-bundle.js`,
      },
    }),
  ]);
};

gulp.task('build:shared', () => {
  const basePlugins = [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
  ];

  return buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, '..', 'lib', 'log-helper.js'),
      plugins: [],
    },
    writeConfig: {
      sourceMap: true,
      format: 'umd',
      moduleName: 'goog.logHelper',
      dest: path.join(__dirname, '..', 'build', 'log-helper.js'),
    },
  })
  .then(() => {
    return buildJSBundle({
      rollupConfig: {
        entry: path.join(__dirname, '..', 'lib', 'assert.js'),
        plugins: basePlugins,
      },
      writeConfig: {
        sourceMap: true,
        format: 'umd',
        moduleName: 'goog.assert',
        dest: path.join(__dirname, '..', 'build', 'assert.js'),
      },
    });
  });
});

gulp.task('build', () => {
  return taskHarness(buildPackage, global.projectOrStar);
});

gulp.task('build:watch', ['build'], (unusedCallback) => {
  gulp.watch(`packages/${global.projectOrStar}/+(src|test)/**/*`, ['build']);
  gulp.watch(`lib/**/*`, ['build']);
});

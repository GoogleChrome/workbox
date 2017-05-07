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
    .then(() => fse.copy(path.join(__dirname, '..', 'LICENSE'),
      path.join(projectPath, 'LICENSE')))
    .then(() => printBuildTime(`${(Date.now() - startTime) / 1000}s`));
};

gulp.task('build:shared', () => {
  return buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, '..', 'lib', 'log-helper.js'),
      format: 'umd',
      moduleName: 'goog.logHelper',
      plugins: [],
    },
    buildPath: 'build/log-helper.js',
    projectDir: path.join(__dirname, '..'),
  });
});

gulp.task('build', () => {
  return taskHarness(buildPackage, global.projectOrStar);
});

gulp.task('build:watch', ['build'], (unusedCallback) => {
  gulp.watch(`packages/${global.projectOrStar}/src/**/*`, ['build']);
  gulp.watch(`lib/**/*`, ['build']);
});

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

/* eslint-disable no-console, valid-jsdoc */

const childProcess = require('child_process');
const path = require('path');
const promisify = require('promisify-node');
const fs = require('fs');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const header = require('gulp-header');

const globPromise = promisify('glob');

/**
 * Wrapper on top of childProcess.spawn() that returns a promise which rejects
 * when the child process has a non-zero exit code and resolves otherwise.
 *
 * @param {String} command The command to spawn.
 * @param {Array.<String>} args The parameters to pass to the command.
 * @return {Promise} Settles once command completes. Resolves if the exit code
 *                    is 0, and rejects otherwise.
 */
function processPromiseWrapper(command, args) {
  return new Promise((resolve, reject) => {
    const process = childProcess.spawn(command, args, {stdio: 'inherit'});
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Error ${code} returned from ${command} ${args}`);
      }
    });
  });
}

/**
 * Promise.all() rejects immediately as soon as the first Promise rejects.
 * This wrapper will run each Promise to resolution, and if one or more
 * rejected, reject at the end with a concatenated error message.
 *
 * @param {Array.<Promise>} promises The promises to wait on.
 * @return {Promise.<*>} Resolves with null if all the promises resolve.
 *                        Otherwise, rejects with a concatenated error.
 */
function taskPromiseWrapper(projects, task, args) {
  let rejected = [];
  return projects.reduce((promiseChain, project) => {
    return promiseChain.then(() => {
      return task(path.join(__dirname, path.dirname(project)), args)
      .catch((error) => {
        rejected.push(error);
      });
    });
  }, Promise.resolve())
  .then(() => rejected.length ? Promise.reject(rejected.join('\n')) : null);
}

/**
 * Helper function that runs a task against all projects, or just one of them.
 * It will collect all the results and reject if any of the tasks rejects.
 *
 * @param {Function} task The function to run.
 * @param {String} projectOrStar Either the name of a project, or '*' for all.
 * @param {...Object} [args] Optional additional arguments to pass to task.
 * @return {Promise.<*>} Resolves with null if all the promises resolve.
 *                        Otherwise, rejects with a concatenated error.
 */
function taskHarness(task, projectOrStar, ...args) {
  return globPromise(`packages/${projectOrStar}/package.json`)
    .then((projects) => taskPromiseWrapper(projects, task));
}

/**
 * This method will bundle JS with Rollup and then run through Babel for
 * async and await transpilation and minification with babili. This will
 * also add a license header and create sourcemaps.
 *
 * @param  {Object} options Options object with 'projectDir' and 'rollupConfig'
 * @return {[type]}         [description]
 */
function buildJSBundle(options) {
  const destPath = path.join(options.projectDir, 'build');
  const licenseHeader = fs.readFileSync('LICENSE-HEADER', 'utf8');

  if (options.outputName.indexOf('build/') !== 0) {
    throw new Error('Expected options.ouputName to start with \'build/\'');
  }

  return new Promise((resolve, reject) => {
    gulp.src([
      path.join(options.projectDir, 'src', '**', '*.js'),
      path.join('lib', '**', '*.js'),
      path.join('node_modules', '*', '**', '*.js'),
    ])
    .pipe(sourcemaps.init())
    .pipe(rollup(options.rollupConfig))
    .pipe(babel({
      presets: ['babili', {comments: false}],
    }))
    .pipe(header(licenseHeader))
    .pipe(rename(options.outputName.substring('build/'.length)))
    // Source maps are written relative tot he gulp.dest() path
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      reject(err);
    })
    .on('end', () => {
      resolve();
    });
  });
}

module.exports = {globPromise, processPromiseWrapper,
  taskHarness, buildJSBundle};

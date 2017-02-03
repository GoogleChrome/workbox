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

const babel = require('gulp-babel');
const childProcess = require('child_process');
const commonjs = require('rollup-plugin-commonjs');
const fs = require('fs');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const header = require('gulp-header');
const path = require('path');
const promisify = require('promisify-node');
const rename = require('gulp-rename');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('gulp-rollup');
const rollupBabel = require('rollup-plugin-babel');
const sourcemaps = require('gulp-sourcemaps');

const globPromise = promisify('glob');

const LICENSE_HEADER = fs.readFileSync('LICENSE-HEADER', 'utf8');

const PLUGINS = [
  rollupBabel({
    plugins: ['transform-async-to-generator', 'external-helpers'],
      exclude: 'node_modules/**',
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
];

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
      return task(path.join(__dirname, '..', path.dirname(project)), args)
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
 * @return {Promise}
 */
function buildJSBundle(options) {
  return new Promise((resolve, reject) => {
    const outputName = options.buildPath.replace(/^build\//, '');
    const sources = [
      `${options.projectDir}/src/**/*.js`,
      '{lib,packages}/**/*.js',
      // Explicitly avoid matching node_modules/.bin/*.js
      'node_modules/*/**/*.js',
    ];

    gulp.src(sources)
      .pipe(sourcemaps.init())
      .pipe(rollup(options.rollupConfig))
      .pipe(gulpif(options.minify, babel({
        presets: ['babili', {comments: false}],
      })))
      .pipe(header(LICENSE_HEADER))
      .pipe(rename(outputName))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(`${options.projectDir}/build`))
      .on('error', reject)
      .on('end', resolve);
  });
}

/**
 * A helper to generate Rollup build configurations.
 *
 * One build config is generated for each format given in formatToPath.
 * Both minified and unminified build configs are generated.
 *
 * @param {Object.<String,String>} formatToPath A mapping of each format
 *        ('umd', 'es', etc.) to the path to use for the output.
 * @param {String} projectDir The path of the project directory.
 * @param {String} moduleName The name of the module, used in the UMD output.
 * @returns {Array.<Object>}
 */
function generateBuildConfigs(formatToPath, projectDir, moduleName) {
  // This is shared throughout the full permutation of build configs.
  const baseConfig = {
    rollupConfig: {
      entry: path.join(projectDir, 'src', 'index.js'),
      plugins: PLUGINS,
      moduleName,
    },
    projectDir,
  };

  // Use Object.assign() throughout to create copies of the config objects.
  return [true, false].map((minify) => {
    return Object.assign({}, baseConfig, {minify});
  }).map((partialConfig) => {
    return Object.keys(formatToPath).map((format) => {
      const fullConfig = Object.assign({}, partialConfig, {
        buildPath: formatToPath[format],
      });
      fullConfig.rollupConfig = Object.assign({}, partialConfig.rollupConfig, {
        format,
      });

      // Remove the '.min.' from the file name if the output isn't minified.
      if (!fullConfig.minify) {
        fullConfig.buildPath = fullConfig.buildPath.replace('.min.', '.');
      }

      return fullConfig;
    });
  }).reduce((previous, current) => {
    // Flatten the two-dimensional array. E.g.:
    // Input is [[umd-minified, umd-unminified], [es-minified, es-unminified]]
    // Output is [umd-minified, umd-unminified, es-minified, es-unminified]
    return previous.concat(current);
  }, []);
}

module.exports = {
  buildJSBundle,
  generateBuildConfigs,
  globPromise,
  processPromiseWrapper,
  taskHarness,
};

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

const babel = require('rollup-plugin-babel');
const childProcess = require('child_process');
const commonjs = require('rollup-plugin-commonjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const promisify = require('promisify-node');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup').rollup;

const globPromise = promisify('glob');

const LICENSE_HEADER = fs.readFileSync('templates/LICENSE-HEADER.txt', 'utf8');

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
 * Wrapper that runs the local node_modules/.bin/lerna binary, returning a
 * promise when complete.
 *
 * @param args Arguments to pass to the local lerna binary.
 * @return {Promise}
 */
function lernaWrapper(...args) {
  const nodeCommand = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  return processPromiseWrapper(nodeCommand,
    ['run', 'local-lerna', '--'].concat(args));
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
 * This method will bundle JS with Rollup and write it out to disk.
 *
 * @param {Object} options
 * @param {Object} options.rollupConfig The configuration for rollup().
 * @param {Object} options.writeConfig The configuration for bundle.write().
 * @return {Promise}
 */
function buildJSBundle(options) {
  return rollup(options.rollupConfig)
    .then((bundle) => bundle.write(options.writeConfig));
}

/**
 * A helper to generate Rollup build configurations.
 *
 * One build config is generated for each format given in formatToPath.
 * Both minified and unminified build configs are generated.
 *
 * @param {Object} input
 * @param {Object.<String,String>} input.formatToPath A mapping of each format
 * ('iife', 'es', etc.) to the path to use for the output.
 * @param {String} input.baseDir The path of the project directory.
 * @param {String} input.moduleName The name of the module, for the iife output.
 * @param {boolean} [input.shouldBuildProd] Whether or not we should also build
 * a production bundle. Defaults to true.
 * @param {String} [input.entry] Used to override the default entry value of
 * `${baseDir}/src/index.js`.
 * @returns {Array.<Object>}
 */
function generateBuildConfigs({formatToPath, baseDir, moduleName,
                               entry, shouldBuildProd=true}) {
  const buildConfigs = [];

  const basePlugins = [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
  ];

  const devReplacePlugin = replace({
    '`BUILD_PROCESS_REPLACE::BUILD_TARGET`': '`dev`',
  });

  const prodReplacePlugin = replace({
    '`BUILD_PROCESS_REPLACE::BUILD_TARGET`': '`prod`',
    'error-stack-parser': './error-stack-parser-no-op',
    'error-message-factory': './error-message-factory-no-op',
  });

  const babelPlugin = babel({
    presets: [['babili', {
      comments: false,
    }]],
  });

  for (let format of Object.keys(formatToPath)) {
    buildConfigs.push({
      rollupConfig: {
        entry: entry || path.join(baseDir, 'src', 'index.js'),
        plugins: [devReplacePlugin, ...basePlugins],
      },
      writeConfig: {
        banner: LICENSE_HEADER,
        sourceMap: true,
        dest: path.join(baseDir,
          formatToPath[format].replace('.prod.', '.dev.')),
        moduleName,
        format,
      },
    });

    if (shouldBuildProd) {
      buildConfigs.push({
        rollupConfig: {
          entry: entry || path.join(baseDir, 'src', 'index.js'),
          plugins: [prodReplacePlugin, ...basePlugins, babelPlugin],
        },
        writeConfig: {
          banner: LICENSE_HEADER,
          sourceMap: true,
          dest: path.join(baseDir, formatToPath[format]),
          moduleName,
          format,
        },
      });
    }
  }

  return buildConfigs;
}

module.exports = {
  buildJSBundle,
  generateBuildConfigs,
  globPromise,
  lernaWrapper,
  processPromiseWrapper,
  taskHarness,
};

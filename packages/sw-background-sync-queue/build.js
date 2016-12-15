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

const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const pkg = require('./package.json');
const resolve = require('rollup-plugin-node-resolve');
const rollupBabel = require('rollup-plugin-babel');
const {buildJSBundle, generateBuildConfigs} = require('../../build-utils');

const mainModuleBuilds = generateBuildConfigs({
  es: pkg['jsnext:main'],
  umd: pkg.main,
}, __dirname, 'goog.backgroundSyncQueue').map(buildJSBundle);

module.exports = () => Promise.all([
  ...mainModuleBuilds,

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, 'src', 'lib', 'request-queue.js'),
      format: 'umd',
      moduleName: 'goog.backgroundSyncQueue.test.RequestQueue',
      plugins: [
        resolve({
          jsnext: true,
          main: true,
          browser: true,
        }),
        rollupBabel({
          plugins: ['transform-async-to-generator', 'external-helpers'],
          exclude: 'node_modules/**',
        }),
        commonjs(),
      ],
    },
    buildPath: 'build/test/request-queue.js',
    projectDir: __dirname,
  }),

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, 'src', 'lib', 'background-sync-queue.js'),
      format: 'umd',
      moduleName: 'goog.backgroundSyncQueue.test.BackgroundSyncQueue',
      plugins: [
        resolve({
          jsnext: true,
          main: true,
          browser: true,
        }),
        rollupBabel({
          plugins: ['transform-async-to-generator', 'external-helpers'],
          exclude: 'node_modules/**',
        }),
        commonjs(),
      ],
    },
    buildPath: 'build/test/background-sync-queue.js',
    projectDir: __dirname,
  }),

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, 'src', 'lib', 'constants.js'),
      format: 'umd',
      moduleName: 'goog.backgroundSyncQueue.test.constants',
      plugins: [
        resolve({
          jsnext: true,
          main: true,
          browser: true,
        }),
        rollupBabel({
          plugins: ['transform-async-to-generator', 'external-helpers'],
          exclude: 'node_modules/**',
        }),
        commonjs(),
      ],
    },
    buildPath: 'build/test/constants.js',
    projectDir: __dirname,
  }),
]);

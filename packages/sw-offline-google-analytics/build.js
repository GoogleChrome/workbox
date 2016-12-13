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

const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const pkg = require('./package.json');
const {buildJSBundle, generateBuildConfigs} = require('../../build-utils');

const plugins = [
  resolve({
    jsnext: true,
    main: true,
    browser: true,
  }),
  commonjs(),
];

const mainModuleBuilds = generateBuildConfigs({
  umd: pkg.main,
}, __dirname, 'goog.offlineGoogleAnalytics').map(buildJSBundle);

module.exports = () => Promise.all([
  ...mainModuleBuilds,

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, 'src', 'lib', 'enqueue-request.js'),
      format: 'umd',
      moduleName: 'goog.offlineGoogleAnalytics.test.enqueueRequest',
      plugins,
    },
    buildPath: 'build/test/enqueue-request.js',
    projectDir: __dirname,
  }),

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, 'src', 'lib', 'replay-queued-requests.js'),
      format: 'umd',
      moduleName: 'goog.offlineGoogleAnalytics.test.replayRequests',
      plugins,
    },
    buildPath: 'build/test/replay-queued-requests.js',
    projectDir: __dirname,
  }),

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, 'src', 'lib', 'constants.js'),
      format: 'umd',
      moduleName: 'goog.offlineGoogleAnalytics.test.constants',
      plugins,
    },
    buildPath: 'build/test/constants.js',
    projectDir: __dirname,
  }),

  buildJSBundle({
    rollupConfig: {
      entry: path.join(__dirname, '..', '..', 'lib', 'idb-helper.js'),
      format: 'umd',
      moduleName: 'goog.offlineGoogleAnalytics.test.IDBHelper',
      plugins,
    },
    buildPath: 'build/test/idb-helper.js',
    projectDir: __dirname,
  }),
]);

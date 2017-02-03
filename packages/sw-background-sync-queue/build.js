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
const {buildJSBundle, generateBuildConfigs} = require('../../utils/build');

const mainModuleBuilds = generateBuildConfigs({
  es: pkg['jsnext:main'],
  umd: pkg.main,
}, __dirname, 'goog.backgroundSyncQueue').map(buildJSBundle);
const plugin = [
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
];

module.exports = () => {
  return Promise.all([

    ...mainModuleBuilds,
    buildJSBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'index.js'),
        format: 'umd',
        moduleName: 'goog.backgroundSyncQueue',
        plugins: plugin,
      },
      buildPath: 'build/background-sync-queue.js',
      projectDir: __dirname,
    })]).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'index.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.swBackgroundQueue',
          plugins: plugin,
        },
        buildPath: 'build/test/sw-background-queue.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'request-queue.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.RequestQueue',
          plugins: plugin,
        },
        buildPath: 'build/test/request-queue.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'background-sync-queue.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.BackgroundSyncQueue',
          plugins: plugin,
        },
        buildPath: 'build/test/background-sync-queue.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'constants.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.constants',
          plugins: plugin,
        },
        buildPath: 'build/test/constants.js',
        projectDir: __dirname,
      });
  }).then(function() {
    return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib',
            'background-sync-idb-helper.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.backgroundSyncIdbHelper',
          plugins: plugin,
        },
        buildPath: 'build/test/background-sync-idb-helper.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'request-manager.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.RequestManager',
          plugins: plugin,
        },
        buildPath: 'build/test/request-manager.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'queue-utils.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.queueUtils',
          plugins: plugin,
        },
        buildPath: 'build/test/queue-utils.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'broadcast-manager.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.broadcastManager',
          plugins: plugin,
        },
        buildPath: 'build/test/broadcast-manager.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, 'src', 'lib', 'response-manager.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.responseManager',
          plugins: plugin,
        },
        buildPath: 'build/test/response-manager.js',
        projectDir: __dirname,
      });
  }).then(function() {
      return buildJSBundle({
        rollupConfig: {
          entry: path.join(__dirname, '../../', 'lib', 'idb-helper.js'),
          format: 'umd',
          moduleName: 'goog.backgroundSyncQueue.test.IDBHelper',
          plugins: plugin,
        },
        buildPath: 'build/test/idb-helper.js',
        projectDir: __dirname,
      });
  });
};

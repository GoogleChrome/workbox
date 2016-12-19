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
const {buildJSBundle} = require('../../build-utils');

module.exports = () => {
  return Promise.all([
    buildJSBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'client-runtime.js'),
        format: 'umd',
        plugins: [
          resolve({
            jsnext: true,
            main: true,
            browser: true,
          }),
          commonjs(),
        ],
      },
      buildPath: 'build/client-runtime.js',
      projectDir: __dirname,
    }),
    buildJSBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'appcache-behavior-import.js'),
        format: 'umd',
        moduleName: 'goog.appCacheBehavior',
        plugins: [
          resolve({
            jsnext: true,
            main: true,
            browser: true,
          }),
          commonjs(),
        ],
      },
      buildPath: 'build/appcache-behavior-import.js',
      projectDir: __dirname,
    }),
  ]);
};

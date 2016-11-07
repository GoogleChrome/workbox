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

const rollupBabel = require('rollup-plugin-babel');
const path = require('path');
const {buildJSBundle} = require('../../build-utils');
const pkg = require('./package.json');

module.exports = () => {
  return Promise.all([
    buildJSBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'index.js'),
        format: 'umd',
        moduleName: 'goog.runtimeCaching',
        plugins: [
          rollupBabel({
            plugins: ['transform-async-to-generator', 'external-helpers'],
            exclude: 'node_modules/**',
          }),
        ],
      },
      outputName: pkg.main,
      projectDir: __dirname,
    }),
    buildJSBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'index.js'),
        format: 'es',
        plugins: [
          rollupBabel({
            plugins: ['transform-async-to-generator', 'external-helpers'],
            exclude: 'node_modules/**',
          }),
        ],
      },
      outputName: pkg['jsnext:main'],
      projectDir: __dirname,
    }),
  ]);
};

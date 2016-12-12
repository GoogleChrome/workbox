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
const pkg = require('./package.json');
const resolve = require('rollup-plugin-node-resolve');
const rollupBabel = require('rollup-plugin-babel');
const {buildJSBundle, generateBuildConfigs} = require('../../build-utils');

const plugins = [
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

const buildConfigs = generateBuildConfigs({
  es: pkg['jsnext:main'],
  umd: pkg.main,
}, __dirname, 'goog.cacheExpiration', plugins);

module.exports = () => Promise.all(buildConfigs.map(buildJSBundle));

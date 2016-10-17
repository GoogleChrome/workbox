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

const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup').rollup;

const pkg = require('./package.json');
const targets = [{
  dest: path.join(__dirname, 'build', pkg.main),
  format: 'umd',
  moduleName: 'goog.precaching',
  sourceMap: true
}, {
  dest: path.join(__dirname, 'build', pkg['jsnext:main']),
  format: 'es',
  sourceMap: true
}];

module.exports = () => {
  return rollup({
    entry: path.join(__dirname, 'src', 'index.js'),
    plugins: [

    ]
  }).then(bundle => Promise.all(
    targets.map(target => bundle.write(target))
  ));
};

module.exports = () => {
  return rollup({
    entry: path.join(__dirname, 'src', 'index.js'),
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true
      }),
      commonjs(),
      babel({
        plugins: ['transform-async-to-generator', 'external-helpers'],
        exclude: 'node_modules/**'
      })
    ]
  }).then(bundle => Promise.all(
    targets.map(target => bundle.write(target))
  ));
};

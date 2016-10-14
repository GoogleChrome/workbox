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

const path = require('path');
const rollup = require('rollup').rollup;
const pkg = require('./package.json');

const destPath = path.join(__dirname, 'build');

// This defines our the src is transpiled (i.e. one for ES Modules, one for UMD)
const buildTargets = [{
  dest: path.join(destPath, pkg.main),
  format: 'umd',
  moduleName: 'goog.routing',
  sourceMap: true
}, {
  dest: path.join(destPath, pkg['jsnext:main']),
  format: 'es',
  sourceMap: true
}];

module.exports = () => {
  return rollup({
    entry: path.join(__dirname, 'src', 'index.js')
  }).then(bundle => Promise.all(
    buildTargets.map(target => bundle.write(target))
  ));
};

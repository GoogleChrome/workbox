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

const fsExtra = require('fs-extra');
const glob = require('glob');
const path = require('path');
const pkg = require('./package.json');
const upperCamelCase = require('uppercamelcase');
const {buildJSBundle, generateBuildConfigs} = require('../../utils/build');

const productionBuildConfigs = generateBuildConfigs({
  formatToPath: {
    es: pkg['jsnext:main'],
    iife: pkg.main,
  },
  baseDir: __dirname,
  moduleName: 'goog.backgroundSyncQueue',
});

// We don't want the test/ build output to be published.
fsExtra.ensureFileSync(path.join(__dirname, 'build', 'test', '.npmignore'));

const libFiles = glob.sync(`${__dirname}/src/lib/*.js`);
libFiles.push(path.join('lib', 'idb-helper.js'));

const testBuildConfigs = libFiles.reduce((configs, libFile) => {
  const className = upperCamelCase(path.basename(libFile, '.js'));
  const moduleName = `goog.backgroundSyncQueue.test.${className}`;

  return configs.concat(generateBuildConfigs({
    formatToPath: {
      iife: path.join('build', 'test', path.basename(libFile)),
    },
    baseDir: __dirname,
    minify: false,
    entry: libFile,
    moduleName,
  }));
}, []);

module.exports = () => Promise.all(
  [...productionBuildConfigs, ...testBuildConfigs].map(buildJSBundle)
);

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

// It's unclear whether a bespoke build process is needed for each sub-project,
// or whether the top-level gulp task can just use a common, browserify-based
// build with each sub-project exporting a list of files to use as entry points.

import browserify from 'browserify';
import fs from 'fs';
import path from 'path';

module.exports = () => {
  return Promise.all([
    'client-runtime.js',
    'appcache-behavior-import.js'
  ].map(file => {
    return new Promise((resolve, reject) => {
      const bundler = browserify(path.join(__dirname, 'src', file));

      bundler.bundle()
        .pipe(fs.createWriteStream(path.join(__dirname, 'build', file)))
        .on('error', reject)
        .on('finish', resolve);
    });
  }));
};

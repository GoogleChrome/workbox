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

const browserify = require('browserify');
const del = require('del');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

module.exports = directory => {
  const build = `${directory}/build`;
  return del(`${directory}/build`).then(() => {
    fs.mkdirSync(build);
    const files = glob.sync(`${directory}/*.js`);

    return Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const bundler = browserify(file);

        bundler.bundle()
          .pipe(fs.createWriteStream(path.join(build, path.basename(file))))
          .on('error', reject)
          .on('finish', resolve);
      });
    }));
  });
};

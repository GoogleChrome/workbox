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

/* eslint-disable no-console, valid-jsdoc */

const minimist = require('minimist');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const options = minimist(process.argv.slice(2));

if (options.project) {
  // Ensure the project is valid before running tasks
  try {
    fs.statSync(path.posix.join(__dirname, 'packages', options.project));
  } catch (err) {
    throw new Error(`The supplied project '${options.project}' is invalid.`);
  }
}

global.port = options.port || 3000;
global.projectOrStar = options.project || '*';
global.cliOptions = options;

const gulpTaskFiles = glob.sync('./gulp-tasks/*.js');
gulpTaskFiles.forEach((gulpTaskFile) => {
  // Requiring will be enough to register the tasks with gulp.
  require(gulpTaskFile);
});

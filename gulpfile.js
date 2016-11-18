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

const gulp = require('gulp');
const minimist = require('minimist');
const runSequence = require('run-sequence');

const options = minimist(process.argv.slice(2));
global.port = options.port || 3000;
global.projectOrStar = options.project || '*';
global.cliOptions = options;

require('./gulp-tasks/lint.js');
require('./gulp-tasks/build.js');
require('./gulp-tasks/test.js');
require('./gulp-tasks/documentation.js');
require('./gulp-tasks/serve.js');

gulp.task('default', (callback) => {
  runSequence(['lint', 'test'], 'documentation', callback);
});

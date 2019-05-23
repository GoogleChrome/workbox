/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/* eslint-disable no-console, valid-jsdoc */

const minimist = require('minimist');
const fs = require('fs');
const path = require('path');

const options = minimist(process.argv.slice(2));

if (options.package) {
  // Ensure the project is valid before running tasks
  try {
    fs.statSync(path.posix.join(__dirname, 'packages', options.package));
  } catch (err) {
    throw new Error(`The supplied project '${options.package}' is invalid.`);
  }
}

global.port = options.port || 3000;
global.packageOrStar = options.package || '*';
global.cliOptions = options;

// Forward referencing means the order of gulp-task
// requires is important
const gulpTaskFiles = [
  'transpile-typescript',
  'build-node-packages',
  'build-browser-packages',
  'build-window-packages',
  'build-packages',
  'build',
  'lint',
  'test-node',
  'test-integration',
  'test',
  'test-server',
  'analyze-properties',
  'publish-github',
  'publish-cdn',
  'publish-lerna',
  'publish-demos',
  'publish',
  'watch',
  'docs',
  'demos',
];

gulpTaskFiles.forEach((gulpTaskFile) => {
  // Requiring will be enough to register the tasks with gulp.
  require(path.join(__dirname, 'gulp-tasks', gulpTaskFile));
});

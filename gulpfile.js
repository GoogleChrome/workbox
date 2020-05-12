/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/* eslint-disable no-console, valid-jsdoc */

const minimist = require('minimist');
const fs = require('fs');
const upath = require('upath');

const options = minimist(process.argv.slice(2));

if (options.package) {
  // Ensure the package is valid before running tasks
  try {
    fs.statSync(upath.join(__dirname, 'packages', options.package));
  } catch (err) {
    throw new Error(`The supplied package '${options.package}' is invalid.`);
  }
}

global.port = options.port || 3000;
global.packageOrStar = options.package || '*';
global.cliOptions = options;

// Forward referencing means the order of gulp-task
// requires is important.
const taskFiles = [
  'transpile-typescript',
  'build-node-packages',
  'build-sw-packages',
  'build-window-packages',
  'build-packages',
  'build',
  'lint',
  'test-node',
  // 'test-integration',
  // 'test',
  'test-server',
  // 'analyze-properties',
  // 'publish-github',
  // 'publish-cdn',
  // 'publish-lerna',
  // 'publish',
  // 'watch',
  'docs',
];

for (const taskFile of taskFiles) {
  const taskDefinitions = require(`./gulp-tasks/${taskFile}`);
  for (const [name, task] of Object.entries(taskDefinitions)) {
    if (name === 'functions') {
      continue;
    }
    if (name in module.exports) {
      throw new Error(`Duplicate task definition: ${name} defined in` +
        ` ${taskFile} conflicts with another task.`);
    }
    module.exports[name] = task;
  }
}

/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {execSync} = require('child_process');

console.log(process.argv);

const stdout = execSync(`git diff --name-only "${process.argv[2]}"..."${process.argv[3]}"`);
const output = stdout.toString();

console.log('Files changed:', output);

const matched = output.toString().split('\n')
    .some((file) => file.match(/\.(?:js|json|mjs|ts|yml)$/));

if (matched) {
  console.log('At least one file matches.');
  process.exit(0);
}

console.log('No files match.');
process.exit(1);

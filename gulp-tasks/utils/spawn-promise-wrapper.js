/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const spawn = require('child_process').spawn;

module.exports = (command, args, options = {}) => {
  options.stdio = options.stdio || 'inherit';
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options);
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Error ${code} returned from ${command} ${args}`);
      }
    });
  });
};

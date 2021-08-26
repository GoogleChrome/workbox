/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const chalk = require('chalk');

const prefix = function () {
  return chalk.inverse(`[Workbox]:`);
};

module.exports = {
  highlight: chalk.bgCyan,

  debug: (...args) => {
    console.log(prefix(), chalk.dim(...args));
  },

  log: (...args) => {
    console.log(prefix(), ...args);
  },

  warn: (...args) => {
    console.warn(prefix(), chalk.yellow(...args));
  },

  error: (...args) => {
    console.error('\n');
    console.error(prefix(), chalk.red(...args));
    console.error('\n');
  },
};

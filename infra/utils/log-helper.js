const chalk = require('chalk');

const prefix = function() {
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

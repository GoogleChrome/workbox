const chalk = require('chalk');

const prefix = function() {
  return chalk.inverse(`[Workbox Gulp Log]:`);
};

module.exports = {
  highlight: chalk.bgCyan,

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

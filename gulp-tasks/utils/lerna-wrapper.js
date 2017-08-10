const path = require('path');

const spawnPromiseWrapper = require('./spawn-promise-wrapper');

// Use require.resolve() to find the lerna module, then get the lerna
// binary from that. This allows the use of lerna with command line
// flags.
const lernaBinPath = path.join(
  require.resolve('lerna'), '..', '..', 'bin', 'lerna.js');

module.exports = {
  bootstrap: (...args) => {
    return spawnPromiseWrapper(lernaBinPath, ['bootstrap', ...args]);
  },
};

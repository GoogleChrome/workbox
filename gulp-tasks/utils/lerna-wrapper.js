const path = require('path');

const spawnPromiseWrapper = require('./spawn-promise-wrapper');

// Use require.resolve() to find the lerna module, then get the lerna
// binary from that. This allows up to use the module with command line
// flags.
const lernaBinPath = path.join(
  require.resolve('lerna'), '..', '..', 'bin', 'lerna.js');

module.exports = {
  bootstrap: () => {
    return spawnPromiseWrapper(lernaBinPath, ['bootstrap']);
  },
};

const path = require('path');

const spawnPromiseWrapper = require('./spawn-promise-wrapper');

// Use require.resolve() to find the lerna module, then get the lerna
// binary from that. This allows the use of lerna with command line
// flags.
const lernaBinPath = path.join(require.resolve('lerna'), '..', 'cli.js');

module.exports = {
  bootstrap: (...args) => {
    // Have to run with node in front for Windows.
    return spawnPromiseWrapper('node', [lernaBinPath, 'bootstrap', ...args]);
  },
};

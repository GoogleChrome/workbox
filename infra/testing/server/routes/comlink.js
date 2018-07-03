const path = require('path');

const match = '/__WORKBOX/comlink.js';

async function handler(req, res) {
  const comlinkMain = require.resolve('comlinkjs');
  const comlinkPath = path.join(path.dirname(comlinkMain), 'umd', 'comlink.js');
  res.sendFile(comlinkPath);
}

module.exports = {
  handler,
  match,
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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

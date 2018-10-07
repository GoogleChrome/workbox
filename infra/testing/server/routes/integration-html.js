/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');

const match = '/*/integration.html';

async function handler(req, res) {
  const filePath = path.join(__dirname, '..', 'static', 'integration.html');
  res.sendFile(filePath);
}

module.exports = {
  handler,
  match,
};

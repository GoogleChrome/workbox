/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');
const templateData = require('../template-data');

// Matches any URL with a filename that includes `*.tmp.*`.
// When matched, a file in the `../templates/*` directory will be used.
const match = /\.tmp\.[a-z]+$/;

async function handler(req, res) {
  const ext = path.extname(req.path);
  const basename = path.basename(req.path);

  switch (ext) {
    case '.js':
    case '.mjs':
      res.set('Content-Type', 'text/javascript');
      break;
    case '.html':
      res.set('Content-Type', 'text/html');
      break;
  }

  const file = path.join(__dirname, '..', 'templates', basename);
  res.render(file, templateData.get());
}

module.exports = {
  handler,
  match,
};

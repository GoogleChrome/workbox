/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');
const templateData = require('../template-data');

// Matches any URL ending in `.njk` and renders the file in the
// `../templates/*` directory as the response.
// NOTE: this allows you to serve a template file with any directory path,
// which is useful when dealing with service worker scope.
const match = /(\.[a-z]+)\.njk$/;

async function handler(req, res) {
  const ext = req.params[0];

  // Since templates can change between tests without the URL changing,
  // we need to make sure the browser doesn't cache the response.
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Expires', '0');

  switch (ext) {
    case '.js':
    case '.mjs':
      res.set('Content-Type', 'text/javascript');
      break;
    case '.html':
      res.set('Content-Type', 'text/html');
      break;
  }

  const file = path.join(__dirname, '..', 'templates', path.basename(req.path));
  res.render(file, templateData.get());
}

module.exports = {
  handler,
  match,
};

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const globby = require('globby');
const path = require('path');
const templateData = require('../template-data');

const match = '/test/:packageName/window/';

async function handler(req, res) {
  const {packageName} = req.params;
  const testFilter = req.query.filter || '**/test-*.mjs';

  const testFiles =
    (await globby(`test/${packageName}/window/**/${testFilter}`)) || [];

  const testModules = testFiles.map((file) => '/' + file);

  templateData.assign({packageName, testModules, testFilter});

  res.set('Content-Type', 'text/html');

  // Since templates can change between tests without the URL changing,
  // we need to make sure the browser doesn't cache the response.
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Expires', '0');

  const file = path.join(__dirname, '..', 'templates', 'test-window.html.njk');
  res.render(file, templateData.get());
}

module.exports = {
  handler,
  match,
};

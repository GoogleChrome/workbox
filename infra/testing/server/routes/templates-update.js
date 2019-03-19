/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const templateData = require('../template-data');


// An endpoint to update template data from within tests. Any JSON in the
// POST body will be merged with the existing template data.
const match = '/__WORKBOX/updateTemplate';

async function handler(req, res) {
  templateData.assign(req.body);
  res.end();
}

module.exports = {
  handler,
  match,
  method: 'post',
};

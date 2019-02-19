/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const match = '/__WORKBOX/uniqueETag';

let counter = 0;
async function handler(req, res) {
  res.set('ETag', ++counter);
  res.send(`ETag is ${counter}.`);
}

module.exports = {
  handler,
  match,
};

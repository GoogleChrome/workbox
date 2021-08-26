/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const cdn = require('../../packages/workbox-build/src/cdn-details.json');
const lernaPkg = require('../../lerna.json');

module.exports = () =>
  `${cdn.origin}/${cdn.bucketName}/${cdn.releasesDir}` + `/${lernaPkg.version}`;

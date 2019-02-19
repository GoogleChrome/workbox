/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {getCDNOrigin} = require(
    '../../packages/workbox-build/src/lib/cdn-utils');
const lernaPkg = require('../../lerna.json');

module.exports = () => `${getCDNOrigin()}/${lernaPkg.version}`;

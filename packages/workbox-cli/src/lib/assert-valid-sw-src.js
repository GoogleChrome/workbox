/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const assert = require('assert');
const fse = require('fs-extra');

const errors = require('./errors');

const INJECTION_POINT_REGEXP = /\.precacheAndRoute\(\s*\[\s*\]\s*\)/;

module.exports = async (swSrc) => {
  const swContents = await fse.readFile(swSrc, 'utf-8');
  assert(swContents.match(INJECTION_POINT_REGEXP),
      errors['sw-src-missing-injection-point']);
};

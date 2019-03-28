/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';

import * as rangeRequests from '../../../packages/workbox-range-requests/index.mjs';

describe(`[workbox-range-requests] exports`, function() {
  const expectedExports = ['createPartialResponse', 'Plugin'];

  for (const expectedExport of expectedExports) {
    it(`should expose a ${expectedExport} property`, function() {
      expect(rangeRequests).to.have.property(expectedExport);
    });
  }
});

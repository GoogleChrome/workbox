/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';

import * as streams from '../../../packages/workbox-streams/index.mjs';

describe(`[workbox-streams] exports`, function() {
  const expectedExports = [
    'concatenate',
    'concatenateToResponse',
    'isSupported',
  ];

  for (const expectedExport of expectedExports) {
    it(`should expose a ${expectedExport} property`, function() {
      expect(streams).to.have.property(expectedExport);
    });
  }
});

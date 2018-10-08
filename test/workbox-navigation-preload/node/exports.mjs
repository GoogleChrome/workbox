/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';

import * as navigationPreload from '../../../packages/workbox-navigation-preload/index.mjs';

describe(`[workbox-navigation-preload] exports`, function() {
  const expectedExports = [
    'disable',
    'enable',
    'isSupported',
  ];

  for (const expectedExport of expectedExports) {
    it(`should expose a ${expectedExport} property`, function() {
      expect(navigationPreload).to.have.property(expectedExport);
    });
  }
});

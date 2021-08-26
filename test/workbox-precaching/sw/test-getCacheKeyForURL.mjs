/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {getCacheKeyForURL} from 'workbox-precaching/getCacheKeyForURL.mjs';
import {precache} from 'workbox-precaching/precache.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';

describe(`getCacheKeyForURL()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
    resetDefaultPrecacheController();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should return the expected cache keys for various URLs`, async function () {
    precache(['/one', {url: '/two', revision: '1234'}]);

    expect(getCacheKeyForURL('/one')).to.eql(`${location.origin}/one`);
    expect(getCacheKeyForURL(`${location.origin}/two`)).to.eql(
      `${location.origin}/two?__WB_REVISION__=1234`,
    );
    expect(getCacheKeyForURL('/not-precached')).to.not.exist;
  });
});

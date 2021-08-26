/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {isSupported} from 'workbox-navigation-preload/isSupported.mjs';

describe(`isSupported`, function () {
  it(`should return true iff navigation preload is supported`, async function () {
    if (self.registration.navigationPreload) {
      expect(isSupported()).to.equal(true);
    } else {
      expect(isSupported()).to.equal(false);
    }
  });
});

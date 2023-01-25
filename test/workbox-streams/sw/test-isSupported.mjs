/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {isSupported} from 'workbox-streams/isSupported.mjs';

describe(`isSupported`, function () {
  it(`should return true when ReadableStream is available`, async function () {
    try {
      new ReadableStream({start() {}});

      expect(isSupported()).to.be.true;
    } catch (error) {
      expect(isSupported()).to.be.false;
    }
  });
});

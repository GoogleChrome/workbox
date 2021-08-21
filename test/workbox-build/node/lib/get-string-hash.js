/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {
  getStringHash,
} = require('../../../../packages/workbox-build/build/lib/get-string-hash');

describe(`[workbox-build] lib/get-string-hash.js`, function () {
  it(`should return the expected hashes`, function () {
    const stringsToHashes = new Map([
      ['abc', '900150983cd24fb0d6963f7d28e17f72'],
      ['xyz', 'd16fb36f0911f878998c136191af705e'],
    ]);

    for (const [string, hash] of stringsToHashes) {
      expect(getStringHash(string)).to.eql(hash);
    }
  });
});

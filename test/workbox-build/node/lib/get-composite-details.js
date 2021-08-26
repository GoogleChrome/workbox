/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {
  getCompositeDetails,
} = require('../../../../packages/workbox-build/build/lib/get-composite-details');

describe(`[workbox-build] lib/get-composite-details.js`, function () {
  const URL = '/test';

  const ENTRY1 = {
    file: 'file1.txt',
    size: 1234,
    hash: 'hash1',
  };
  const ENTRY2 = {
    file: 'file2.txt',
    size: 5678,
    hash: 'hash2',
  };

  it(`should return the expected composite details for a single file`, function () {
    const details = getCompositeDetails(URL, [ENTRY1]);
    expect(details).to.eql({
      file: URL,
      hash: '00c6ee2e21a7548de6260cf72c4f4b5b',
      size: ENTRY1.size,
    });
  });

  it(`should return the expected composite details for multiple files`, function () {
    const details = getCompositeDetails(URL, [ENTRY1, ENTRY2]);
    expect(details).to.eql({
      file: URL,
      hash: '3dcd1f089c4a94cbbedb7a00d7ec9829',
      size: ENTRY1.size + ENTRY2.size,
    });
  });
});

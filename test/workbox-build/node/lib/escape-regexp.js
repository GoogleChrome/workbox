/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const {
  escapeRegExp,
} = require('../../../../packages/workbox-build/build/lib/escape-regexp');

describe(`[workbox-build] lib/copy-workbox-libraries.js`, function () {
  const expectedValues = new Map([
    ['abcd', 'abcd'],
    ['\\abc()d', '\\\\abc\\(\\)d'],
    ['$?.js', '\\$\\?\\.js'],
    ['.*+?^${}()|[]\\', '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'],
  ]);

  for (const [original, escaped] of expectedValues) {
    it(`should perform the expected escaping: ${original} => ${escaped}`, async function () {
      expect(escapeRegExp(original)).to.eql(escaped);
    });
  }
});

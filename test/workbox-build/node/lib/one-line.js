/*
  Copyright 2026 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');

const {
  oneLine,
} = require('../../../../packages/workbox-build/build/lib/one-line');

describe(`[workbox-build] lib/one-line.js`, function () {
  it(`should join lines with a single space and trim the result`, function () {
    expect(oneLine`
      first
        second

      third
    `).to.eql('first second third');
  });

  it(`should keep whitespace within a line`, function () {
    expect(oneLine`a  b`).to.eql('a  b');
  });

  it(`should insert substitutions, including ones with line breaks`, function () {
    expect(oneLine`a ${1} ${'b\n  c'} ${undefined}`).to.eql(
      'a 1 b c undefined',
    );
  });
});

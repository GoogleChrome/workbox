/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

describe(`[workbox-cli] lib/help-text.js`, function () {
  it(`should be a string`, function () {
    const {
      helpText,
    } = require('../../../../packages/workbox-cli/build/lib/help-text');
    expect(helpText).to.be.a('string');
  });
});

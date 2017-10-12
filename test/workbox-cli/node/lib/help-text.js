const expect = require('chai').expect;

describe(`[workbox-cli] lib/help-text.js`, function() {
  it(`should be a string`, function() {
    const helpText = require('../../../../packages/workbox-cli/src/lib/help-text');
    expect(helpText).to.be.a('string');
  });
});


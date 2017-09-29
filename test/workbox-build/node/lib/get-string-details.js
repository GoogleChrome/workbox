const expect = require('chai').expect;

const getStringDetails = require('../../../../packages/workbox-build/src/lib/get-string-details');

describe(`lib/get-string-details.js`, function() {
  it(`should return the expected details`, function() {
    const inputToExpectedDetails = new Map([
      [['/url-one', 'first-one'], {
        file: '/url-one',
        hash: 'e725107146e32e2e7e75feaa303b7fbc',
        size: 9,
      }],
      [['/url-two', 'another-string'], {
        file: '/url-two',
        hash: '7fb80c5fad3565fd6ce3d9f61a53c659',
        size: 14,
      }],
    ]);

    for (let [[url, string], expectedDetails] of inputToExpectedDetails) {
      const details = getStringDetails(url, string);
      expect(details).to.eql(expectedDetails);
    }
  });
});

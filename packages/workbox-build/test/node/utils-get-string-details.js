const getCompositeDetails = require('../../src/lib/utils/get-composite-details');
require('chai').should();

describe('src/lib/utils/get-composite-details.js', function() {
  it('should return the expected details', function() {
    const inputToExpectedDetails = new Map([
      [['/url-one', [{hash: 'abc', size: 1}, {hash: 'def', size: 10}]], {
        file: '/url-one',
        hash: 'e80b5017098950fc58aad83c8c14978e',
        size: 11,
      }],
      [['/url-two', [{hash: 'abc', size: 1}, {hash: 'def', size: 10}, {hash: 'ghi', size: 100}]], {
        file: '/url-two',
        hash: '8aa99b1f439ff71293e95357bac6fd94',
        size: 111,
      }],
    ]);

    for (let [[url, dependencyDetails], expectedDetails] of inputToExpectedDetails) {
      const details = getCompositeDetails(url, dependencyDetails);
      details.should.eql(expectedDetails);
    }
  });
});

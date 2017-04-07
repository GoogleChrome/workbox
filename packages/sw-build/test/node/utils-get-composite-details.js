const getStringDetails = require('../../src/lib/utils/get-string-details');
require('chai').should();

describe('src/lib/utils/get-string-details.js', function() {
  it('should return the expected details', function() {
    const inputToExpectedDetails = new Map([
      [['/url-one', 'string-one'], {
        file: '/url-one',
        hash: 'b4bd80493a3563e56e7d737e24e070f9',
        size: 10,
      }],
      [['/url-two', 'string-two'], {
        file: '/url-two',
        hash: 'c072be4f941962a251224c265f519252',
        size: 10,
      }],
    ]);

    for (let [[url, string], expectedDetails] of inputToExpectedDetails) {
      const details = getStringDetails(url, string);
      details.should.eql(expectedDetails);
    }
  });
});

const getStringHash = require('../../src/lib/utils/get-string-hash');
require('chai').should();

describe('src/lib/utils/get-string-hash.js', function() {
  it('should return the expected hash', function() {
    const stringsToHashes = {
      abc: '900150983cd24fb0d6963f7d28e17f72',
      xyz: 'd16fb36f0911f878998c136191af705e',
    };
    Object.keys(stringsToHashes).forEach((string) => {
      const hash = getStringHash(string);
      hash.should.equal(stringsToHashes[string]);
    });
  });
});

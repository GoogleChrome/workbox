importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Cache ID', function() {
  it('should fail on bad cacheId parameter', function() {
    const EXPECTED_ERROR_NAME = 'bad-cache-id';
    const badInputs = [
      true,
      [],
      {},
    ];
    badInputs.forEach((badInput, index) => {
      let thrownError = null;
      try {
        new goog.SWLib({
          cacheId: badInput,
        });
        throw new Error(`Expected error to be thrown for inputs[${index}]: '${badInput}'.`);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(EXPECTED_ERROR_NAME);
    });
  });

  it('should precache and provide runtime cache with cacheId prefix', function() {
    const CACHE_ID = 'CACHE_ID_LOLZ';
    const swlib = new goog.SWLib({
      cacheId: CACHE_ID,
    });

    swlib._revisionedCacheManager.getCacheName().indexOf(CACHE_ID).should.not.equal(-1);
    swlib.runtimeCacheName.indexOf(CACHE_ID).should.not.equal(-1);
  });
});

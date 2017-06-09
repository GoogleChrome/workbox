importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

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
        new WorkboxSW({
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
    const workboxSW = new WorkboxSW({
      cacheId: CACHE_ID,
    });

    workboxSW._revisionedCacheManager.getCacheName().indexOf(CACHE_ID).should.not.equal(-1);
    workboxSW.runtimeCacheName.indexOf(CACHE_ID).should.not.equal(-1);
  });
});

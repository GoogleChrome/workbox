importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-precaching');

describe('Test cacheId Parameter', function() {
  let cacheManager;

  afterEach(function() {
    if (cacheManager) {
      cacheManager._close();
    }
    cacheManager = null;
  });

  it('should throw on bad cacheId input', function() {
    let thrownError;
    try {
      cacheManager = new workbox.precaching.RevisionedCacheManager({
        cacheId: {},
      });
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('bad-cache-id');
    expect(thrownError.extras).to.deep.equal({cacheId: {}});
  });

  it('should be able to generate cacheManager with cacheId', function() {
    const CACHE_ID = 'Cache_ID_Example';
    cacheManager = new workbox.precaching.RevisionedCacheManager({
      cacheId: CACHE_ID,
    });
    cacheManager.getCacheName().indexOf(CACHE_ID).should.not.equal(-1);
  });
});

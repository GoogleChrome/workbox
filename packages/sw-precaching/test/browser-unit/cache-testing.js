/* global goog, expect */

describe('sw-precaching Test Revisioned Caching', function() {
  beforeEach(function() {
    return window.goog.swUtils.cleanState();
  });

  after(function() {
    // return window.goog.swUtils.cleanState();
  });

  it('should cache files', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/sw.js')
    .then(() => {
      return window.caches.keys();
    })
    .then((cacheNames) => {
      cacheNames.length.should.equal(1);
      return window.caches.open(cacheNames[0]);
    })
    .then((cache) => {
      return cache.keys();
    })
    .then((cachedResponses) => {
      cachedResponses.length.should.equal(goog.__TEST_DATA.EXAMPLE_REVISIONED_FILES.length);

      goog.__TEST_DATA.EXAMPLE_REVISIONED_FILES.forEach((assetAndHash) => {
        let matchingResponse = null;
        cachedResponses.forEach((cachedResponse) => {
          let desiredPath = assetAndHash;
          if (typeof assetAndHash !== 'string') {
            desiredPath = assetAndHash.path;
          }

          if (cachedResponse.url.indexOf(desiredPath) !== -1) {
            matchingResponse = cachedResponse;
            return;
          }
        });

        expect(matchingResponse).to.exist;
      });
    });
  });
});

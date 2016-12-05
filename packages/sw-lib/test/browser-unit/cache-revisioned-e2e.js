/* global goog, expect */

describe('sw-lib Test Revisioned Caching', function() {
  const deleteIndexedDB = () => {
    return new Promise((resolve, reject) => {
      // TODO: Move to constants
      const req = indexedDB.deleteDatabase('sw-precaching');
      req.onsuccess = function() {
        resolve();
      };
      req.onerror = function() {
        reject();
      };
      req.onblocked = function() {
        console.error('Database deletion is blocked.');
      };
    });
  };

  beforeEach(function() {
    return window.goog.swUtils.cleanState()
    .then(deleteIndexedDB);
  });

  afterEach(function() {
    /** return window.goog.swUtils.cleanState()
    .then(deleteIndexedDB);**/
  });

  const testFileSet = (iframe, fileSet) => {
    return window.caches.keys()
    .then((cacheNames) => {
      cacheNames.length.should.equal(1);
      return window.caches.open(cacheNames[0]);
    })
    .then((cache) => {
      return cache.keys();
    })
    .then((cachedResponses) => {
      cachedResponses.length.should.equal(fileSet.length);

      fileSet.forEach((assetAndHash) => {
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
    })
    .then(() => {
      const promises = fileSet.map((assetAndHash) => {
        let url = assetAndHash;
        if (typeof assetAndHash === 'object') {
          url = assetAndHash.path;
        }

        return iframe.contentWindow.fetch(url);
      });
      return Promise.all(promises);
    })
    .then((cachedResponses) => {
      let responses = {};
      const promises = cachedResponses.map((cachedResponse) => {
        return cachedResponse.text()
        .then((bodyText) => {
          responses[cachedResponse.url] = bodyText;
        });
      });
      return Promise.all(promises)
      .then(() => {
        return responses;
      });
    });
  };

  const compareCachedAssets = function(beforeData, afterData) {
    afterData.cacheList.forEach((afterAssetAndHash) => {
      if (typeof assetAndHash === 'string') {
        afterAssetAndHash = {path: afterAssetAndHash, revision: afterAssetAndHash};
      }

      let matchingBeforeAssetAndHash = null;
      beforeData.cacheList.forEach((beforeAssetAndHash) => {
        if (typeof beforeAssetAndHash === 'string') {
          beforeAssetAndHash = {path: beforeAssetAndHash, revision: beforeAssetAndHash};
        }

        if (beforeAssetAndHash.path === afterAssetAndHash.path) {
          matchingBeforeAssetAndHash = beforeAssetAndHash;
        }
      });

      if (!matchingBeforeAssetAndHash) {
        return;
      }

      let pathToCheck = new URL(afterAssetAndHash.path, location.origin).toString();

      const beforeResponseBody = beforeData.cachedResponses[pathToCheck];
      const afterResponseBody = afterData.cachedResponses[pathToCheck];

      if (matchingBeforeAssetAndHash.revision === afterAssetAndHash.revision) {
        // The request should be the same
        beforeResponseBody.should.equal(afterResponseBody);
      } else {
        // The request should be different
        beforeResponseBody.should.not.equal(afterResponseBody);
      }
    });
  };

  it('should cache and fetch files', function() {
    const allAssets1 = goog.__TEST_DATA['sw-lib']['set-1']
      .concat(goog.__TEST_DATA['sw-lib']['set-2'])
      .concat(goog.__TEST_DATA['sw-lib']['set-3']);

    const allAssets2 = goog.__TEST_DATA['sw-lib']['set-4']
      .concat(goog.__TEST_DATA['sw-lib']['set-5'])
      .concat(goog.__TEST_DATA['sw-lib']['set-6']);

    return window.goog.swUtils.activateSW('data/sw/cache-revisioned-1.js')
    .then((iframe) => {
      return testFileSet(iframe, allAssets1);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.activateSW('data/sw/cache-revisioned-2.js')
      .then((iframe) => {
        return testFileSet(iframe, allAssets2);
      })
      .then((step2Responses) => {
        compareCachedAssets({
          cacheList: allAssets1,
          cachedResponses: step1Responses,
        }, {
          cacheList: allAssets2,
          cachedResponses: step2Responses,
        });
      });
    });
  });
});

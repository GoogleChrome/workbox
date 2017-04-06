/* global goog, expect */

describe('cache-revisioned-e2e.js', function() {
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
    return window.goog.swUtils.cleanState()
    .then(deleteIndexedDB);
  });

  const testCacheEntries = (fileSet) => {
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
            desiredPath = assetAndHash.url;
          }

          if (cachedResponse.url.indexOf(desiredPath) !== -1) {
            matchingResponse = cachedResponse;
            return;
          }
        });

        expect(matchingResponse).to.exist;
      });
    });
  };

  const testFileSet = (iframe, swPath, fileSet) => {
    return testCacheEntries(fileSet)
    .then(() => {
      let responses = {};
      const promises = fileSet.map((assetAndHash) => {
        let url = assetAndHash;
        if (typeof assetAndHash === 'object') {
          url = assetAndHash.url;
        }

        // This handles relative URL's that will be relative to the service
        // works path.
        const parsedURL = new URL(
          url,
          new URL(swPath, location).toString()
        ).toString();
        return iframe.contentWindow.fetch(parsedURL)
        .then((cachedResponse) => {
          if (cachedResponse.type === 'opaque') {
            responses[url] = null;
          } else {
            return cachedResponse.text()
            .then((bodyText) => {
              responses[url] = bodyText;
            });
          }
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
      if (typeof afterAssetAndHash === 'string') {
        afterAssetAndHash = {url: afterAssetAndHash, revision: afterAssetAndHash};
      }

      let matchingBeforeAssetAndHash = null;
      beforeData.cacheList.forEach((beforeAssetAndHash) => {
        if (typeof beforeAssetAndHash === 'string') {
          beforeAssetAndHash = {url: beforeAssetAndHash, revision: beforeAssetAndHash};
        }

        if (beforeAssetAndHash.url === afterAssetAndHash.url) {
          matchingBeforeAssetAndHash = beforeAssetAndHash;
        }
      });

      if (!matchingBeforeAssetAndHash) {
        return;
      }

      const beforeResponseBody = beforeData.cachedResponses[afterAssetAndHash.url];
      const afterResponseBody = afterData.cachedResponses[afterAssetAndHash.url];

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
    const testSet = goog.__TEST_DATA['sw-lib']['revisioned'];
    const allAssets1 = testSet['set-1']
      .concat(testSet['set-2'])
      .concat(testSet['set-3']);

    const allAssets2 = testSet['set-4']
      .concat(testSet['set-5'])
      .concat(testSet['set-6']);

    const sw1 = '/packages/sw-lib/test/static/sw/cache-revisioned-1.js';
    const sw2 = '/packages/sw-lib/test/static/sw/cache-revisioned-2.js';
    return window.goog.swUtils.activateSW(sw1)
    .then((iframe) => {
      return testFileSet(iframe, sw1, allAssets1);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.activateSW(sw2)
      .then((iframe) => {
        return testFileSet(iframe, sw2, allAssets2);
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

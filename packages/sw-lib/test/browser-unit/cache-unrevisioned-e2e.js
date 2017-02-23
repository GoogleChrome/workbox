/* global goog, expect */

describe('cache-unrevisioned-e2e.js', function() {
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

      fileSet.forEach((fileUrl) => {
        let matchingResponse = null;
        cachedResponses.forEach((cachedResponse) => {
          let desiredPath = fileUrl;
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
    fileSet = fileSet.map((entry) => {
      if (entry instanceof Request) {
        return entry.url;
      }
      return entry;
    });

    return testCacheEntries(fileSet)
    .then(() => {
      let responses = {};
      const promises = fileSet.map((fileUrl) => {
        let url = fileUrl;

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
    const unrevisionedData = goog.__TEST_DATA['sw-lib']['unrevisioned'];
    const allAssets1 = unrevisionedData['set-1']
      .concat(unrevisionedData['set-2'])
      .concat(unrevisionedData['set-3']);

    const allAssets2 = unrevisionedData['set-4']
      .concat(unrevisionedData['set-5'])
      .concat(unrevisionedData['set-6']);

    const sw1 = 'data/sw/cache-unrevisioned-1.js';
    const sw2 = 'data/sw/cache-unrevisioned-2.js';
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

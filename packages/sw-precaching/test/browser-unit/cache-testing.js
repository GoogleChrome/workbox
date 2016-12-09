/* global goog, expect */

describe('sw-precaching Test Revisioned Caching', function() {
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
            desiredPath = assetAndHash.request;
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

  const testFileSet = (iframe, fileSet) => {
    return testCacheEntries(fileSet)
    .then(() => {
      const promises = fileSet.map((assetAndHash) => {
        let url = assetAndHash;
        if (typeof assetAndHash === 'object') {
          url = assetAndHash.request;
        }

        return iframe.contentWindow.fetch(url);
      });
      return Promise.all(promises);
    })
    .then((cachedResponses) => {
      let responses = {};
      const promises = cachedResponses.map((cachedResponse) => {
        if (cachedResponse.type === 'opaque') {
          responses[cachedResponse.url] = null;
        } else {
          return cachedResponse.text()
          .then((bodyText) => {
            responses[cachedResponse.url] = bodyText;
          });
        }
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
        afterAssetAndHash = {request: afterAssetAndHash, revision: afterAssetAndHash};
      }

      let matchingBeforeAssetAndHash = null;
      beforeData.cacheList.forEach((beforeAssetAndHash) => {
        if (typeof beforeAssetAndHash === 'string') {
          beforeAssetAndHash = {request: beforeAssetAndHash, revision: beforeAssetAndHash};
        }

        if (beforeAssetAndHash.request === afterAssetAndHash.request) {
          matchingBeforeAssetAndHash = beforeAssetAndHash;
        }
      });

      if (!matchingBeforeAssetAndHash) {
        return;
      }

      let pathToCheck = new URL(afterAssetAndHash.request, location.origin).toString();
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
    return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw-2.js')
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      })
      .then((step2Responses) => {
        compareCachedAssets({
          cacheList: goog.__TEST_DATA['set-1']['step-1'],
          cachedResponses: step1Responses,
        }, {
          cacheList: goog.__TEST_DATA['set-1']['step-2'],
          cachedResponses: step2Responses,
        });
      });
    });
  });

  it('should manage cache deletion', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.clearAllCaches()
      .then(() => {
        return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw-2.js');
      })
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      });
    });
  });

  it('should manage indexedDB deletion', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      return deleteIndexedDB()
      .then(() => {
        return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw-2.js');
      })
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      });
    });
  });

  it('should only request duplicate entries once', function() {
    let allEntries = [];
    goog.__TEST_DATA['duplicate-entries'].forEach((entries) => {
      allEntries = allEntries.concat(entries);
    });
    allEntries = [...new Set(allEntries)];

    return window.goog.swUtils.activateSW('data/duplicate-entries/duplicate-entries-sw.js')
    .then((iframe) => {
      return iframe.contentWindow.fetch('/__api/get-requests-made/')
      .then((response) => {
        return response.json();
      })
      .then((requestsMade) => {
        if (allEntries.length !== requestsMade.length) {
          throw new Error('Duplicate requests have been made: ' + JSON.stringify(requestsMade));
        }
      })
      .then(() => {
        return iframe;
      });
    })
    .then((iframe) => {
      return testFileSet(iframe, allEntries);
    })
    .then((responses) => {
    });
  });

  it('should fail to install with 404 cache request', function() {
    return window.goog.swUtils.activateSW('data/response-types/404-sw.js')
    .then(() => {
      throw new Error('Expected SW to fail installation due to caching 404 entry.');
    }, (err) => {
      // NOOP - The error is not to do with the error throw in SW, so nothing
      // to check.
    });
  });

  it('should cache opaque responses by default', function() {
    return window.goog.swUtils.activateSW('data/response-types/opaque-sw.js')
    .then(() => {
      throw new Error('Expected SW to fail installation due to caching 404 entry.');
    }, (err) => {
      // NOOP - The error is not to do with the error throw in SW, so nothing
      // to check.
    });
  });
});

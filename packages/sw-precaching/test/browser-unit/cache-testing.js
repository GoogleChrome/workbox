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

  const testFileSet = (iframe, fileSet) => {
    return testCacheEntries(fileSet)
    .then(() => {
      let responses = {};
      const promises = fileSet.map((assetAndHash) => {
        let url = assetAndHash;
        if (typeof assetAndHash === 'object') {
          url = assetAndHash.url;
        }

        return iframe.contentWindow.fetch(url)
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

  const compareRevisionedCachedAssets = function(beforeData, afterData) {
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

  const compareUnrevisionedCachedAssets = function(beforeData, afterData) {
    afterData.cacheList.forEach((afterURL) => {
      if (afterURL instanceof Request) {
        afterURL = afterURL.url;
      }

      let matchingBeforeUrl = null;
      beforeData.cacheList.forEach((beforeUrl) => {
        if (beforeUrl instanceof Request) {
          beforeUrl = beforeUrl.url;
        }

        if (beforeUrl === afterURL) {
          matchingBeforeUrl = beforeUrl;
        }
      });

      if (!matchingBeforeUrl) {
        return;
      }

      const beforeResponseBody = beforeData.cachedResponses[afterURL];
      const afterResponseBody = afterData.cachedResponses[afterURL];

      // The request should be different
      beforeResponseBody.should.not.equal(afterResponseBody);
    });
  };

  it('should cache and fetch revisioned urls', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-revisioned-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.activateSW('data/basic-cache/basic-revisioned-cache-sw-2.js')
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      })
      .then((step2Responses) => {
        compareRevisionedCachedAssets({
          cacheList: goog.__TEST_DATA['set-1']['step-1'],
          cachedResponses: step1Responses,
        }, {
          cacheList: goog.__TEST_DATA['set-1']['step-2'],
          cachedResponses: step2Responses,
        });
      });
    });
  });

  it('should cache and fetch unrevisioned urls', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-unrevisioned-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-2']['step-1']);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.activateSW('data/basic-cache/basic-unrevisioned-cache-sw-2.js')
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-2']['step-2']);
      })
      .then((step2Responses) => {
        compareUnrevisionedCachedAssets({
          cacheList: goog.__TEST_DATA['set-2']['step-1'],
          cachedResponses: step1Responses,
        }, {
          cacheList: goog.__TEST_DATA['set-2']['step-2'],
          cachedResponses: step2Responses,
        });
      });
    });
  });

  it('should manage revisioned cache deletion', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-revisioned-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.clearAllCaches()
      .then(() => {
        return window.goog.swUtils.activateSW('data/basic-cache/basic-revisioned-cache-sw-2.js');
      })
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      });
    });
  });

  it('should manage unrevisioned cache deletion', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-unrevisioned-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-2']['step-1']);
    })
    .then((step1Responses) => {
      return window.goog.swUtils.clearAllCaches()
      .then(() => {
        return window.goog.swUtils.activateSW('data/basic-cache/basic-unrevisioned-cache-sw-2.js');
      })
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-2']['step-2']);
      });
    });
  });

  it('should manage revisioned indexedDB deletion', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-revisioned-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      return deleteIndexedDB()
      .then(() => {
        return window.goog.swUtils.activateSW('data/basic-cache/basic-revisioned-cache-sw-2.js');
      })
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      });
    });
  });

  it('should only request revisioned duplicate entries once', function() {
    let allEntries = [];
    goog.__TEST_DATA['duplicate-entries'].forEach((entries) => {
      allEntries = allEntries.concat(entries);
    });
    allEntries = [...new Set(allEntries)];

    return window.goog.swUtils.activateSW('data/duplicate-entries/duplicate-entries-revisioned-sw.js')
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

  it('should only request unrevisioned duplicate entries once', function() {
    let allEntries = [];
    goog.__TEST_DATA['duplicate-entries'].forEach((entries) => {
      allEntries = allEntries.concat(entries);
    });
    allEntries = [...new Set(allEntries)];

    return window.goog.swUtils.activateSW('data/duplicate-entries/duplicate-entries-unrevisioned-sw.js')
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

  it('should fail to install revisioned with 404 cache request', function() {
    return window.goog.swUtils.activateSW('data/response-types/404-revisioned-sw.js')
    .then(() => {
      throw new Error('Expected SW to fail installation due to caching 404 entry.');
    }, (err) => {
      // NOOP - The error is not to do with the error throw in SW, so nothing
      // to check.
    });
  });

  it('should fail to install unrevisioned with 404 cache request', function() {
    return window.goog.swUtils.activateSW('data/response-types/404-unrevisioned-sw.js')
    .then(() => {
      throw new Error('Expected SW to fail installation due to caching 404 entry.');
    }, (err) => {
      // NOOP - The error is not to do with the error throw in SW, so nothing
      // to check.
    });
  });

  it('should fail to cache revisioned opaque responses by default', function() {
    return window.goog.swUtils.activateSW('data/response-types/opaque-revisioned-sw.js')
    .then(() => {
      throw new Error('Expected SW to fail installation due to caching 404 entry.');
    }, (err) => {
      // NOOP - The error is not to do with the error throw in SW, so nothing
      // to check.
    });
  });

  it('should cache unrevisioned opaque responses by default', function() {
    return window.goog.swUtils.activateSW('data/response-types/opaque-unrevisioned-sw.js')
    .then(() => {
      throw new Error('Expected SW to fail installation due to caching 404 entry.');
    }, (err) => {
      // NOOP - The error is not to do with the error throw in SW, so nothing
      // to check.
    });
  });
});

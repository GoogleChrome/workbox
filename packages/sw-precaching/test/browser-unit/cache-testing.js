/* global goog, expect */

describe('sw-precaching Test Revisioned Caching', function() {
  beforeEach(function() {
    return window.goog.swUtils.cleanState();
  });

  after(function() {
    // return window.goog.swUtils.cleanState();
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
      const promises = cachedResponses.map((cachedResponse) => {
        return cachedResponse.text()
        .then((bodyText) => {
          return {
            url: cachedResponse.url,
            body: bodyText,
          };
        });
      });
      return Promise.all(promises);
    });
  };

  it('should cache and fetch files', function() {
    return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw.js')
    .then((iframe) => {
      return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-1']);
    })
    .then((step1Responses) => {
      console.log(step1Responses);
      return window.goog.swUtils.activateSW('data/basic-cache/basic-cache-sw-2.js')
      .then((iframe) => {
        return testFileSet(iframe, goog.__TEST_DATA['set-1']['step-2']);
      })
      .then((step2Responses) => {
        console.log(step2Responses);
      });
    })
    .then(() => {
      console.log('Hello world.');
    });
  });
});

importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/sw-cache-expiration'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

let count = 0;
function getUniqueUrl() {
  return 'https://example.com/?count=' + count++;
}
function getUniqueCacheName() {
  return 'test-cache-' + count++;
}

describe('Test of the CacheExpiration class', function() {
  const MAX_AGE_SECONDS = 3;
  const MAX_ENTRIES = 3;
  const NOW = 1487106334920;

  const timestampPropertyName = goog.cacheExpiration.timestampPropertyName;
  const urlPropertyName = goog.cacheExpiration.urlPropertyName;
  const CacheExpiration = goog.cacheExpiration.CacheExpiration;

  it(`should throw when CacheExpiration() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new CacheExpiration();
    } catch(err) {
      thrownError = err;
    }

    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-entries-or-age-required');
  });

  it(`should throw when CacheExpiration() is called with an invalid maxEntries parameter`, function() {
    let thrownError = null;
    try {
      new CacheExpiration({maxEntries: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-entries-must-be-number');
  });

  it(`should throw when CacheExpiration() is called with an invalid maxAgeSeconds parameter`, function() {
    let thrownError = null;
    try {
      new CacheExpiration({maxAgeSeconds: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-age-seconds-must-be-number');
  });

  it(`should use the maxAgeSeconds from the constructor`, function() {
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin.maxAgeSeconds).to.equal(MAX_AGE_SECONDS);
  });

  it(`should use the maxEntries from the constructor`, function() {
    const plugin = new CacheExpiration({maxEntries: MAX_ENTRIES});
    expect(plugin.maxEntries).to.equal(MAX_ENTRIES);
  });

  it(`should return the same IDB instance when getDB() is called multiple times`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new CacheExpiration({maxEntries: MAX_ENTRIES});
    return plugin.getDB({cacheName}).then((firstDB) => {
      return plugin.getDB({cacheName}).then((secondDB) => {
        expect(firstDB).to.eql(secondDB);
      });
    });
  });

  it(`should return the same Cache instance when getCache() is called multiple times`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new CacheExpiration({maxEntries: MAX_ENTRIES});
    return plugin.getCache({cacheName}).then((firstCache) => {
      return plugin.getCache({cacheName}).then((secondCache) => {
        expect(firstCache).to.eql(secondCache);
      });
    });
  });

  it(`should return true when there's no cachedResponse passed to isResponseFresh()`, function() {
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin.isResponseFresh()).to.be.true;
  });

  it(`should return true when isResponseFresh() is called and there's no maxAgeSeconds`, function() {
    const plugin = new CacheExpiration({maxEntries: MAX_ENTRIES});
    const cachedResponse = new Response();
    expect(plugin.isResponseFresh({cachedResponse})).to.be.true;
  });

  it(`should return true when isResponseFresh() is called and there's no Date: header in the cachedResponse`, function() {
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    const cachedResponse = new Response();
    expect(plugin.isResponseFresh({cachedResponse})).to.be.true;
  });

  it(`should return true when isResponseFresh() is called and the Date: header in the cachedResponse is recent`, function() {
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    const date = new Date(NOW).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.isResponseFresh({cachedResponse, now: NOW})).to.be.true;
  });

  it(`should return false when isResponseFresh() is called and the Date: header in the cachedResponse is not recent`, function() {
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    // This will construct a date that is 1 second past the expiration.
    const date = new Date(NOW - ((MAX_AGE_SECONDS + 1) * 1000)).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.isResponseFresh({cachedResponse, now: NOW})).to.be.false;
  });

  it(`should update IndexedDB when updateTimestamp() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    const url = getUniqueUrl();

    return plugin.updateTimestamp({cacheName, url, now: NOW})
      .then(() => plugin.getDB({cacheName}))
      .then((db) => {
        const tx = db.transaction(cacheName, 'readonly');
        const store = tx.objectStore(cacheName);
        return store.get(url);
      }).then((entry) => expect(entry[timestampPropertyName]).to.equal(NOW));
  });

  it(`should only find expired entries when findOldEntries() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new CacheExpiration({maxAgeSeconds: MAX_AGE_SECONDS});
    const firstStaleUrl = getUniqueUrl();
    const secondStaleUrl = getUniqueUrl();
    const firstFreshUrl = getUniqueUrl();
    const secondFreshUrl = getUniqueUrl();
    const freshNow = NOW - (MAX_AGE_SECONDS - 1) * 1000;
    const staleNow = NOW - (MAX_AGE_SECONDS + 1) * 1000;
    const updatePromises = [
      plugin.updateTimestamp({cacheName, url: firstFreshUrl, now: freshNow}),
      plugin.updateTimestamp({cacheName, url: secondFreshUrl, now: freshNow}),
      plugin.updateTimestamp({cacheName, url: firstStaleUrl, now: staleNow}),
      plugin.updateTimestamp({cacheName, url: secondStaleUrl, now: staleNow}),
    ];

    return Promise.all(updatePromises)
      .then(() => plugin.findOldEntries({cacheName, now: NOW}))
      .then((oldEntries) => expect(oldEntries).to.eql([firstStaleUrl, secondStaleUrl]));
  });

  it(`should find only extra entries when findExtraEntries() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new CacheExpiration({maxEntries: MAX_ENTRIES});
    const urls = [];
    const extraEntryCount = 2;
    for (let i = 0; i < MAX_ENTRIES + extraEntryCount; i++) {
      urls.push(getUniqueUrl());
    }
    const updatePromises = urls.map((url, i) => plugin.updateTimestamp({
      cacheName, url, now: NOW + i}));

    return Promise.all(updatePromises)
      .then(() => plugin.findExtraEntries({cacheName}))
      .then((extraEntries) => expect(extraEntries).to.eql(urls.slice(0, extraEntryCount)))
      // Test again with the urls[0] value updated, so that it's no longer the oldest.
      .then(() => plugin.updateTimestamp({cacheName, url: urls[0], now: NOW + MAX_ENTRIES}))
      .then(() => plugin.findExtraEntries({cacheName}))
      .then((extraEntries) => expect(extraEntries).to.eql(urls.slice(1, extraEntryCount + 1)));
  });

  it(`should delete expired entries when deleteFromCacheAndIDB() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new CacheExpiration({maxEntries: MAX_ENTRIES});
    const urls = [];
    const extraEntryCount = 2;
    for (let i = 0; i < MAX_ENTRIES + extraEntryCount; i++) {
      urls.push(getUniqueUrl());
    }
    const updatePromises = urls.map((url, i) => plugin.updateTimestamp({
      cacheName, url, now: NOW + i}));

    return Promise.all(updatePromises)
      .then(() => caches.open(cacheName))
      .then((cache) => {
        return Promise.all(urls.map((url) => cache.put(url, new Response())))
          .then(() => plugin.findExtraEntries({cacheName}))
          .then((urls) => plugin.deleteFromCacheAndIDB({cacheName, urls}))
          .then(() => cache.keys())
          .then((responses) => responses.map((response) => response.url))
          .then((cachedURLs) => expect(cachedURLs).to.eql(urls.slice(extraEntryCount)))
          .then(() => plugin.getDB({cacheName}))
          .then((db) => {
            const tx = db.transaction(cacheName, 'readonly');
            const store = tx.objectStore(cacheName);
            return store.getAll();
          }).then((idbEntries) => idbEntries.map((entry) => entry[urlPropertyName]))
          .then((idbEntryUrls) => expect(idbEntryUrls).to.eql(urls.slice(extraEntryCount)));
      });
  });
});

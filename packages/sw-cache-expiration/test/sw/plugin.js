importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-cache-expiration/build/sw-cache-expiration.js'
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

describe('Test of the Plugin class', function() {
  const maxAgeSeconds = 3;
  const maxEntries = 3;
  const now = 1487106334920;
  const timestampPropertyName = goog.cacheExpiration.timestampPropertyName;
  const urlPropertyName = goog.cacheExpiration.urlPropertyName;

  const Plugin = goog.cacheExpiration.Plugin;

  it(`should throw when Plugin() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new Plugin();
    } catch(err) {
      thrownError = err;
    }

    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-entries-or-age-required');
  });

  it(`should throw when Plugin() is called with an invalid maxEntries parameter`, function() {
    let thrownError = null;
    try {
      new Plugin({maxEntries: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-entries-must-be-number');
  });

  it(`should throw when Plugin() is called with an invalid maxAgeSeconds parameter`, function() {
    let thrownError = null;
    try {
      new Plugin({maxAgeSeconds: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-age-seconds-must-be-number');
  });

  it(`should use the maxAgeSeconds from the constructor`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    expect(plugin.maxAgeSeconds).to.equal(maxAgeSeconds);
  });

  it(`should use the maxEntries from the constructor`, function() {
    const plugin = new Plugin({maxEntries});
    expect(plugin.maxEntries).to.equal(maxEntries);
  });

  it(`should return the same IDB instance when getDB() is called multiple times`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new Plugin({maxEntries});
    return plugin.getDB({cacheName}).then((firstDB) => {
      return plugin.getDB({cacheName}).then((secondDB) => {
        expect(firstDB).to.eql(secondDB);
      });
    });
  });

  it(`should return the same Cache instance when getCache() is called multiple times`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new Plugin({maxEntries});
    return plugin.getCache({cacheName}).then((firstCache) => {
      return plugin.getCache({cacheName}).then((secondCache) => {
        expect(firstCache).to.eql(secondCache);
      });
    });
  });

  it(`should return true when there's no cachedResponse passed to isResponseFresh()`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    expect(plugin.isResponseFresh()).to.be.true;
  });

  it(`should return true when isResponseFresh() is called and there's no maxAgeSeconds`, function() {
    const plugin = new Plugin({maxEntries});
    const cachedResponse = new Response();
    expect(plugin.isResponseFresh({cachedResponse})).to.be.true;
  });

  it(`should return true when isResponseFresh() is called and there's no Date: header in the cachedResponse`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    const cachedResponse = new Response();
    expect(plugin.isResponseFresh({cachedResponse})).to.be.true;
  });

  it(`should return true when isResponseFresh() is called and the Date: header in the cachedResponse is recent`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    const date = new Date(now).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.isResponseFresh({cachedResponse, now})).to.be.true;
  });

  it(`should return false when isResponseFresh() is called and the Date: header in the cachedResponse is not recent`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    // This will construct a date that is 1 second past the expiration.
    const date = new Date(now - ((maxAgeSeconds + 1) * 1000)).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.isResponseFresh({cachedResponse, now})).to.be.false;
  });

  it(`should return cachedResponse when cacheWillMatch() is called and isResponseFresh() is true`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    const date = new Date(now).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.cacheWillMatch({cachedResponse, now})).to.eql(cachedResponse);
  });

  it(`should return null when cacheWillMatch() is called and isResponseFresh() is false`, function() {
    const plugin = new Plugin({maxAgeSeconds});
    // This will construct a date that is 1 second past the expiration.
    const date = new Date(now - ((maxAgeSeconds + 1) * 1000)).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.cacheWillMatch({cachedResponse, now})).to.be.null;
  });

  it(`should update IndexedDB when updateTimestamp() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new Plugin({maxAgeSeconds});
    const url = getUniqueUrl();

    return plugin.updateTimestamp({cacheName, url, now})
      .then(() => plugin.getDB({cacheName}))
      .then((db) => {
        const tx = db.transaction(cacheName, 'readonly');
        const store = tx.objectStore(cacheName);
        return store.get(url);
      }).then((entry) => expect(entry[timestampPropertyName]).to.equal(now));
  });

  it(`should only find expired entries when findOldEntries() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new Plugin({maxAgeSeconds});
    const firstStaleUrl = getUniqueUrl();
    const secondStaleUrl = getUniqueUrl();
    const firstFreshUrl = getUniqueUrl();
    const secondFreshUrl = getUniqueUrl();
    const freshNow = now - (maxAgeSeconds - 1) * 1000;
    const staleNow = now - (maxAgeSeconds + 1) * 1000;
    const updatePromises = [
      plugin.updateTimestamp({cacheName, url: firstFreshUrl, now: freshNow}),
      plugin.updateTimestamp({cacheName, url: secondFreshUrl, now: freshNow}),
      plugin.updateTimestamp({cacheName, url: firstStaleUrl, now: staleNow}),
      plugin.updateTimestamp({cacheName, url: secondStaleUrl, now: staleNow}),
    ];

    return Promise.all(updatePromises)
      .then(() => plugin.findOldEntries({cacheName, now}))
      .then((oldEntries) => expect(oldEntries).to.eql([firstStaleUrl, secondStaleUrl]));
  });

  it(`should find only extra entries when findExtraEntries() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new Plugin({maxEntries});
    const urls = [];
    const extraEntryCount = 2;
    for (let i = 0; i < maxEntries + extraEntryCount; i++) {
      urls.push(getUniqueUrl());
    }
    const updatePromises = urls.map((url, i) => plugin.updateTimestamp({
      cacheName, url, now: now + i}));

    return Promise.all(updatePromises)
      .then(() => plugin.findExtraEntries({cacheName}))
      .then((extraEntries) => expect(extraEntries).to.eql(urls.slice(0, extraEntryCount)))
      // Test again with the urls[0] value updated, so that it's no longer the oldest.
      .then(() => plugin.updateTimestamp({cacheName, url: urls[0], now: now + maxEntries}))
      .then(() => plugin.findExtraEntries({cacheName}))
      .then((extraEntries) => expect(extraEntries).to.eql(urls.slice(1, extraEntryCount + 1)));
  });

  it(`should delete expired entries when deleteFromCacheAndIDB() is called`, function() {
    const cacheName = getUniqueCacheName();
    const plugin = new Plugin({maxEntries});
    const urls = [];
    const extraEntryCount = 2;
    for (let i = 0; i < maxEntries + extraEntryCount; i++) {
      urls.push(getUniqueUrl());
    }
    const updatePromises = urls.map((url, i) => plugin.updateTimestamp({
      cacheName, url, now: now + i}));

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

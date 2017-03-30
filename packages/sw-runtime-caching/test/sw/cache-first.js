importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-runtime-caching/build/sw-runtime-caching.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

function expectSameResponseBodies(first, second) {
  const firstClone = first.clone();
  const secondClone = second.clone();

  return Promise.all([firstClone.text(), secondClone.text()])
    .then(([firstBody, secondBody]) => expect(firstBody).to.eql(secondBody));
}

describe('Test of the CacheFirst handler', function() {
  const cacheName = location.href;
  const requestWrapper = new goog.runtimeCaching.RequestWrapper({cacheName});
  const cacheFirst = new goog.runtimeCaching.CacheFirst({requestWrapper, waitOnCache: true});
  const url = new URL('/__echo/counter', location).href;

  let cache;
  let initialCachedResponse;

  before(() => {
    const event = new FetchEvent('fetch', {request: new Request(url)});
    return caches.delete(cacheName)
      .then(() => caches.open(cacheName))
      .then((openedCache) => cache = openedCache)
      .then(() => cacheFirst.handle({event}))
      .then(() => cache.match(url))
      .then((cachedResponse) => initialCachedResponse = cachedResponse);
  });

  it(`should add the initial response to the cache`, function() {
    expect(initialCachedResponse).to.exist;
  });

  it(`should reuse the initial cached response without updating the cache`, function() {
    const event = new FetchEvent('fetch', {request: new Request(url)});
    return cacheFirst.handle({event})
      .then((handleResponse) => expectSameResponseBodies(initialCachedResponse, handleResponse))
      .then(() => cache.match(url))
      .then((currentCachedResponse) => expectSameResponseBodies(initialCachedResponse, currentCachedResponse));
  });
});

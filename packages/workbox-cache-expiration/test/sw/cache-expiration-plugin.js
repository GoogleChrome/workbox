importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-cache-expiration'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the CacheExpirationPlugin class', function() {
  const MAX_AGE_SECONDS = 3;
  const NOW = 1487106334920;

  it(`should extend the CacheExpiration class`, function() {
    const plugin = new goog.cacheExpiration.CacheExpirationPlugin(
      {maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin).to.be.instanceOf(goog.cacheExpiration.CacheExpiration);
  });

  it(`should expose a cacheWillMatch() method`, function() {
    const plugin = new goog.cacheExpiration.CacheExpirationPlugin(
      {maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin).to.respondTo('cacheWillMatch');
  });

  it(`should expose a cacheDidUpdate() method`, function() {
    const plugin = new goog.cacheExpiration.CacheExpirationPlugin(
      {maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin).to.respondTo('cacheDidUpdate');
  });

  it(`should return cachedResponse when cacheWillMatch() is called and isResponseFresh() is true`, function() {
    const plugin = new goog.cacheExpiration.CacheExpirationPlugin(
      {maxAgeSeconds: MAX_AGE_SECONDS});
    const date = new Date(NOW).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.cacheWillMatch({cachedResponse, now: NOW})).to.eql(cachedResponse);
  });

  it(`should return null when cacheWillMatch() is called and isResponseFresh() is false`, function() {
    const plugin = new goog.cacheExpiration.CacheExpirationPlugin(
      {maxAgeSeconds: MAX_AGE_SECONDS});
    // This will construct a date that is 1 second past the expiration.
    const date = new Date(NOW - ((MAX_AGE_SECONDS + 1) * 1000)).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.cacheWillMatch({cachedResponse, now: NOW})).to.be.null;
  });
});

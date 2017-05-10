importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-cacheable-response'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the CacheableResponsePlugin class', function() {
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  it(`should extend the CacheableResponse class`, function() {
    const plugin = new goog.cacheableResponse.CacheableResponsePlugin(
      {headers: VALID_HEADERS});
    expect(plugin).to.be.instanceOf(goog.cacheableResponse.CacheableResponse);
  });

  it(`should expose a the cacheWillUpdate() method`, function() {
    const plugin = new goog.cacheableResponse.CacheableResponsePlugin(
      {headers: VALID_HEADERS});
    expect(plugin).to.respondTo('cacheWillUpdate');
  });
});

importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-cacheable-response');

describe('Test of the CacheableResponsePlugin class', function() {
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  it(`should extend the CacheableResponse class`, function() {
    const plugin = new workbox.cacheableResponse.CacheableResponsePlugin(
      {headers: VALID_HEADERS});
    expect(plugin).to.be.instanceOf(workbox.cacheableResponse.CacheableResponse);
  });

  it(`should expose a the cacheWillUpdate() method`, function() {
    const plugin = new workbox.cacheableResponse.CacheableResponsePlugin(
      {headers: VALID_HEADERS});
    expect(plugin).to.respondTo('cacheWillUpdate');
  });
});

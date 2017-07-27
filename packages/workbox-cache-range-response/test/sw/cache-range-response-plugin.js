importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-cache-range-response');

describe('Test of the CacheRangeResponsePlugin class', function() {
  it(`should extend the CacheRangeResponse class`, function() {
    const plugin = new workbox.cacheRangeResponse.CacheRangeResponsePlugin();
    expect(plugin).to.be.instanceOf(workbox.cacheRangeResponse.CacheRangeResponse);
  });

  it(`should expose a the cacheWillMatch() method`, function() {
    expect(workbox.cacheRangeResponse.CacheRangeResponsePlugin)
      .itself.to.respondTo('cacheWillMatch');
  });
});

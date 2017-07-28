importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-range-requests');

describe('Test of the CachedRangeResponsePlugin class', function() {
  it(`should expose a the cacheWillMatch() method`, function() {
    expect(workbox.rangeRequests.CachedRangeResponsePlugin)
      .itself.to.respondTo('cacheWillMatch');
  });
});

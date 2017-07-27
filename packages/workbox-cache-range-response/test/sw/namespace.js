importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-cache-range-response');

const exportedSymbols = [
  'CacheRangeResponse',
  'CacheRangeResponsePlugin',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.cacheRangeResponse', function() {
    expect(workbox.cacheRangeResponse).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via workbox.cacheRangeResponse`, function() {
      expect(workbox.cacheRangeResponse[exportedSymbol]).to.exist;
    });
  });
});

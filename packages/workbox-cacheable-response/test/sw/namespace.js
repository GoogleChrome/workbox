importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-cacheable-response');

const exportedSymbols = [
  'CacheableResponse',
  'CacheableResponsePlugin',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.cacheableResponse', function() {
    expect(workbox.cacheableResponse).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via workbox.cacheableResponse`, function() {
      expect(workbox.cacheableResponse[exportedSymbol]).to.exist;
    });
  });
});

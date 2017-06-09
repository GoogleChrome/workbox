importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-cache-expiration');

const exportedSymbols = [
  'timestampPropertyName',
  'urlPropertyName',
  'CacheExpiration',
  'CacheExpirationPlugin',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.cacheExpiration', function() {
    expect(workbox.cacheExpiration).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via workbox.cacheExpiration`, function() {
      expect(workbox.cacheExpiration[exportedSymbol]).to.exist;
    });
  });
});

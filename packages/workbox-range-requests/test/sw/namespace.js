importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-range-requests');

const exportedSymbols = [
  'calculateEffectiveBoundaries',
  'handleRangeRequest',
  'parseRangeHeader',
  'CachedRangeResponsePlugin',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.rangeRequests', function() {
    expect(workbox.rangeRequests).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via workbox.rangeRequests`, function() {
      expect(workbox.rangeRequests[exportedSymbol]).to.exist;
    });
  });
});

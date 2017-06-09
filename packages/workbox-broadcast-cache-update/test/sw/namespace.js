importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-broadcast-cache-update');

const exportedSymbols = [
  'BroadcastCacheUpdate',
  'BroadcastCacheUpdatePlugin',
  'broadcastUpdate',
  'cacheUpdatedMessageType',
  'responsesAreSame',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.broadcastCacheUpdate', function() {
    expect(workbox.broadcastCacheUpdate).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via workbox.broadcastCacheUpdate`, function() {
      expect(workbox.broadcastCacheUpdate[exportedSymbol]).to.exist;
    });
  });
});

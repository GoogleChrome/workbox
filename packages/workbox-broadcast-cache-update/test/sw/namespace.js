importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-broadcast-cache-update'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

const exportedSymbols = [
  'BroadcastCacheUpdate',
  'BroadcastCacheUpdatePlugin',
  'broadcastUpdate',
  'cacheUpdatedMessageType',
  'responsesAreSame',
];

describe('Test Library Surface', function() {
  it('should be accessible via goog.broadcastCacheUpdate', function() {
    expect(goog.broadcastCacheUpdate).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via goog.broadcastCacheUpdate`, function() {
      expect(goog.broadcastCacheUpdate[exportedSymbol]).to.exist;
    });
  });
});

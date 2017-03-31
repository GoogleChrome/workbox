importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-cacheable-response/build/sw-cacheable-response.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

const exportedSymbols = [
  'CacheableResponse',
  'CacheableResponsePlugin',
];

describe('Test Library Surface', function() {
  it('should be accessible via goog.cacheableResponse', function() {
    expect(goog.cacheableResponse).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via goog.cacheableResponse`, function() {
      expect(goog.cacheableResponse[exportedSymbol]).to.exist;
    });
  });
});

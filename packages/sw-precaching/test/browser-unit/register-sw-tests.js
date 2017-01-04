
describe('Service Worker Unit Tests', function() {
  const swUnitTests = [
    'sw-unit/basic.js',
    'sw-unit/revisioned-caching.js',
    'sw-unit/unrevisioned-caching.js',
  ];

  swUnitTests.forEach((swUnitTestPath) => {
    it(`should register ${swUnitTestPath} sw tests`, function() {
      return window.goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath);
    });
  });
});

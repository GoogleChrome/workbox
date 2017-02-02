
describe('Service Worker Unit Tests', function() {
  beforeEach(function() {
    return window.goog.swUtils.cleanState();
  });

  const swUnitTests = [
    'basic.js',
    'revisioned-caching.js',
    'unrevisioned-caching.js',
    'cookies.js',
  ];

  swUnitTests.forEach((swUnitTestPath) => {
    it(`should register '${swUnitTestPath}' sw tests`, function() {
      return window.goog.mochaUtils.registerServiceWorkerMochaTests(`../sw/${swUnitTestPath}`);
    });
  });
});

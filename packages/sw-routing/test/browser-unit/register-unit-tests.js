describe('Service Worker Unit Tests', function() {
  beforeEach(() => window.goog.swUtils.cleanState());

  const swUnitTests = [
    'sw-unit/namespace.js',
    'sw-unit/route.js',
    'sw-unit/express-route.js',
    'sw-unit/regexp-route.js',
  ];

  swUnitTests.forEach((swUnitTestPath) => {
    it(`should register ${swUnitTestPath}`,
      () => window.goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath));
  });
});

describe('Service Worker Unit Test Registration', function() {
  beforeEach(() => window.goog.swUtils.cleanState());

  const swUnitTests = [
    'unit/namespace.js',
    'unit/route.js',
    'unit/express-route.js',
    'unit/regexp-route.js',
  ];

  swUnitTests.forEach((swUnitTestPath) => {
    it(`should register ${swUnitTestPath}`,
      () => window.goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath));
  });
});

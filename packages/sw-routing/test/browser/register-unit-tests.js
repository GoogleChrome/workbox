describe('Service Worker Unit Test Registration', function() {
  const pathPrefix = '../sw/';
  const swUnitTests = [
    'namespace.js',
    'route.js',
    'express-route.js',
    'regexp-route.js',
  ].map((script) => `${pathPrefix}${script}`);

  swUnitTests.forEach(function(swUnitTestPath) {
    it(`should register ${swUnitTestPath}`, function() {
      return goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath);
    });
  });
});

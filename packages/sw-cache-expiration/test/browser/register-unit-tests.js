describe('Service Worker Unit Test Registration', function() {
  const pathPrefix = '../sw/';
  const swUnitTests = [
    'namespace.js',
    'cache-expiration.js',
    'cache-expiration-plugin.js',
  ].map((script) => `${pathPrefix}${script}`);

  swUnitTests.forEach(function(swUnitTestPath) {
    it(`should register ${swUnitTestPath}`, function() {
      return goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath);
    });
  });
});

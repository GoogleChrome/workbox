describe('Service Worker Unit Test Registration', function() {
  const pathPrefix = '../sw/';
  const swUnitTests = [
    'cache-first.js',
    'cache-only.js',
    'network-first.js',
    'network-only.js',
    'request-wrapper.js',
    'stale-while-revalidate.js',
  ].map((script) => `${pathPrefix}${script}`);

  swUnitTests.forEach(function(swUnitTestPath) {
    it(`should register ${swUnitTestPath}`, function() {
      return goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath);
    });
  });
});

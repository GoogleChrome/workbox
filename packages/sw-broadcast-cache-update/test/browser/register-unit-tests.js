describe('Service Worker Unit Test Registration', function() {
  const pathPrefix = '../sw/';
  const swUnitTests = [
    'broadcast-cache-update.js',
    'broadcast-cache-update-plugin.js',
    'broadcast-update.js',
    'namespace.js',
    'responses-are-same.js',
  ].map((script) => `${pathPrefix}${script}`);

  swUnitTests.forEach(function(swUnitTestPath) {
    it(`should register ${swUnitTestPath}`, function() {
      return goog.mochaUtils.registerServiceWorkerMochaTests(swUnitTestPath);
    });
  });
});

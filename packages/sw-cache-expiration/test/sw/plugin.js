importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-cache-expiration/build/sw-cache-expiration.min.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the Plugin class', function() {
  it(`should throw when Plugin() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new goog.cacheExpiration.Plugin();
    } catch(err) {
      thrownError = err;
    }

    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-entries-or-age-required');
  });

  it(`should throw when Plugin() is called with an invalid maxEntries parameter`, function() {
    let thrownError = null;
    try {
      new goog.cacheExpiration.Plugin({maxEntries: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-entries-must-be-number');
  });

  it(`should throw when Plugin() is called with an invalid maxAgeSeconds parameter`, function() {
    let thrownError = null;
    try {
      new goog.cacheExpiration.Plugin({maxAgeSeconds: 'invalid'});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('max-age-seconds-must-be-number');
  });

  it(`should use the maxAgeSeconds from the constructor`, function() {
    const maxAgeSeconds = 1;
    const plugin = new goog.cacheExpiration.Plugin({maxAgeSeconds});
    expect(plugin.maxAgeSeconds).to.equal(maxAgeSeconds);
  });

  it(`should use the maxEntries from the constructor`, function() {
    const maxEntries = 1;
    const plugin = new goog.cacheExpiration.Plugin({maxEntries});
    expect(plugin.maxEntries).to.equal(maxEntries);
  });
});

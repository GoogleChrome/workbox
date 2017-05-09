importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/sw-broadcast-cache-update'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the BroadcastCacheUpdatePlugin class', function() {
  const channelName = 'test-channel';
  const cacheName = 'test-cache';
  const oldResponse = new Response();
  const newResponse = new Response();
  const bcuPlugin = new goog.broadcastCacheUpdate.BroadcastCacheUpdatePlugin({channelName});

  it(`should throw when cacheDidUpdate is called and cacheName is missing`, function() {
    let thrownError = null;
    try {
      bcuPlugin.cacheDidUpdate({oldResponse, newResponse});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isType');
  });

  it(`should throw when cacheDidUpdate is called and newResponse is missing`, function() {
    let thrownError = null;
    try {
      bcuPlugin.cacheDidUpdate({cacheName, oldResponse});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isInstance');
  });

  it(`should throw not throw when cacheDidUpdate is called with valid parameters`, function() {
    bcuPlugin.cacheDidUpdate({cacheName, oldResponse, newResponse});
  });
});

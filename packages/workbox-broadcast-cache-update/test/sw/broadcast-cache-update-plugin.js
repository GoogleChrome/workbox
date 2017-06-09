importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-broadcast-cache-update');

describe('Test of the BroadcastCacheUpdatePlugin class', function() {
  const channelName = 'test-channel';
  const cacheName = 'test-cache';
  const oldResponse = new Response();
  const newResponse = new Response();
  const bcuPlugin = new workbox.broadcastCacheUpdate.BroadcastCacheUpdatePlugin({channelName});

  it(`should throw when cacheDidUpdate is called and cacheName is missing`, function() {
    let thrownError = null;
    try {
      bcuPlugin.cacheDidUpdate({oldResponse, newResponse});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when cacheDidUpdate is called and newResponse is missing`, function() {
    let thrownError = null;
    try {
      bcuPlugin.cacheDidUpdate({cacheName, oldResponse});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw not throw when cacheDidUpdate is called with valid parameters`, function() {
    bcuPlugin.cacheDidUpdate({cacheName, oldResponse, newResponse});
  });
});

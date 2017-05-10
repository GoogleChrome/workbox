importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-broadcast-cache-update'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the broadcastUpdate function', function() {
  const channelName = 'test-channel';
  const channel = new BroadcastChannel(channelName);
  const cacheName = 'test-cache';
  const url = 'https://example.com';
  const source = 'test-source';

  it(`should throw when broadcastUpdate() is called without any parameters`, function() {
    expect(() => goog.broadcastCacheUpdate.broadcastUpdate()).to.throw();
  });

  it(`should trigger the appropriate message event on a BroadcastChannel with the same channel name`, function(done) {
    const secondChannel = new BroadcastChannel(channelName);
    secondChannel.addEventListener('message', (event) => {
      expect(event.data).to.eql({
        type: goog.broadcastCacheUpdate.cacheUpdatedMessageType,
        meta: source,
        payload: {
          cacheName,
          updatedUrl: url,
        },
      });
      done();
    });
    goog.broadcastCacheUpdate.broadcastUpdate({channel, cacheName, source, url});
  });
});

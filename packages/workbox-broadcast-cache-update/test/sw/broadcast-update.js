importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-broadcast-cache-update');

describe('Test of the broadcastUpdate function', function() {
  const channelName = 'test-channel';
  const channel = new BroadcastChannel(channelName);
  const cacheName = 'test-cache';
  const url = 'https://example.com';
  const source = 'test-source';

  it(`should throw when broadcastUpdate() is called without any parameters`, function() {
    expect(() => workbox.broadcastCacheUpdate.broadcastUpdate()).to.throw();
  });

  it(`should trigger the appropriate message event on a BroadcastChannel with the same channel name`, function(done) {
    const secondChannel = new BroadcastChannel(channelName);
    secondChannel.addEventListener('message', (event) => {
      expect(event.data).to.eql({
        type: workbox.broadcastCacheUpdate.cacheUpdatedMessageType,
        meta: source,
        payload: {
          cacheName,
          updatedUrl: url,
        },
      });
      done();
    });
    workbox.broadcastCacheUpdate.broadcastUpdate({channel, cacheName, source, url});
  });
});

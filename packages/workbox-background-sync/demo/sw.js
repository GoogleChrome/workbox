/* global workbox*/
importScripts(
  '../build/importScripts/workbox-background-sync.dev.v0.0.1.js',
  '../../workbox-routing/build/importScripts/workbox-routing.dev.v0.0.1.js',
  '../../workbox-runtime-caching/build/importScripts/'
    + 'workbox-runtime-caching.dev.v0.0.1.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});


let bgQueue = new workbox.backgroundSync.QueuePlugin({callbacks:
  {
    onResponse: async(requestId, response) => {
      let res = await response.text();
      self.registration.showNotification('Background sync demo', {
        body: `Replay for request id: ${requestId} is completed`
        + ` with response counter: ${res}`,
        icon: 'https://shop.polymer-project.org/images/shop-icon-384.png',
      });
    },
    onRetryFailure: (requestId) => {
      self.registration.showNotification('Background sync demo', {
        body: `Replay has been failed for request id: ${requestId}`,
        icon: 'https://shop.polymer-project.org/images/shop-icon-384.png',
      });
    },
  },
  dbName: 'queues',
});

const replayBroadcastChannel = new BroadcastChannel('replay_channel');
replayBroadcastChannel.onmessage = function() {
  bgQueue.replayRequests();
};

const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
  plugins: [bgQueue],
});

const route = new workbox.routing.RegExpRoute({
  regExp: new RegExp('^http://localhost:3000/__echo/counter'),
  handler: new workbox.runtimeCaching.NetworkOnly({requestWrapper}),
});

const router = new workbox.routing.Router();
router.registerRoute({route});

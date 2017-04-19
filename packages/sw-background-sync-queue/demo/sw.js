/* global goog*/
importScripts(
	'../build/background-sync-queue.js',
	'../../sw-routing/build/sw-routing.js',
	'../../sw-runtime-caching/build/sw-runtime-caching.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// initialize bdQ
goog.backgroundSyncQueue.initialize();

let bgQueue = new goog.backgroundSyncQueue.BackgroundSyncQueue({callbacks:
	{
		onResponse: async(hash, res) => {
			self.registration.showNotification('Background sync demo', {
				body: 'Product has been purchased.',
				icon: 'https://shop.polymer-project.org/images/shop-icon-384.png',
			});
		},
		onRetryFailure: (hash) => {},
	},
});

const replayBroadcastChannel = new BroadcastChannel('replay_channel');
replayBroadcastChannel.onmessage = function() {
	bgQueue.replayRequests();
};

const requestWrapper = new goog.runtimeCaching.RequestWrapper({
  plugins: [bgQueue],
});

const route = new goog.routing.RegExpRoute({
  regExp: new RegExp('^https://jsonplaceholder.typicode.com/(\\w+)'),
  handler: new goog.runtimeCaching.NetworkOnly({requestWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});

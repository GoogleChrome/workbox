/* global goog*/
importScripts('../build/background-sync-queue.js');

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


self.addEventListener('fetch', function(e) {
	if (e.request.url.startsWith('https://jsonplaceholder.typicode.com')) {
		const clone = e.request.clone();
		e.respondWith(fetch(e.request).catch((err)=>{
			bgQueue.pushIntoQueue({
				request: clone,
			});
			throw err;
		}));
	}
});


// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

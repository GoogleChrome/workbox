/* global goog*/
importScripts('../build/background-sync-queue.js');

// initialize bdQ
goog.backgroundSyncQueue.initialize({callbacks: {
	onRetrySuccess: async (hash, res)=>{
		let data = await res.json();
		self.registration.showNotification('Successfull with count: '+ data.count);
	},
	onRetryFailure: (hash)=>{
	},
}});

self.addEventListener('fetch', function(e) {
	if (e.request.url.startsWith('https://jsonplaceholder.typicode.com')) {
		const clone = e.request.clone();
		e.respondWith(fetch(e.request).catch((err)=>{
			goog.backgroundSyncQueue.pushIntoQueue({
				request: clone
			});
			throw err;
		}));
	}
});


// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

importScripts('../build/background-sync-queue.js')

//initialize bdQ
goog.backgroundSyncQueue.initialize({},{
	onRetrySuccess: async (hash, req, res)=>{
		console.log("success", req, res);
		var data = await res.json();
		self.registration.showNotification("Successfull with count: "+ data.count)
	},
	onRetryFailure: (hash, req)=>{
		console.log("failed", req);
	}
})

self.addEventListener('fetch',function(e){
	if(e.request.url.startsWith("http://message-list.appspot.com/messages"))
	{
		const clone = e.request.clone();
		e.respondWith(fetch(e.request).catch(err=>{
			goog.backgroundSyncQueue.pushIntoQueue(clone);
			throw err;
		}));
	}
});


// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
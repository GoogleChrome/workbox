importScripts('../build/background-sync-queue.js')

//initialize bdQ
goog.backgroundSyncQueue.initialize({},{
	onRetrySuccess: async (req, res)=>{
		console.log("success", req, res);
		var data = await res.json();
		self.registration.showNotification("Successfull with count: "+ data.count)
	},
	onRetryFailure: (req)=>{
		console.log("failed", req);
	} 
})

self.addEventListener('fetch',function(e){
	if(e.request.url.startsWith("http://message-list.appspot.com/messages"))
	{
		var p = new Promise((res,rej)=>{
			const clone = e.request.clone();
			fetch(e.request).then(r=>{
				res(r);
			}).catch(e=>{
				console.log("offline mode");
				goog.backgroundSyncQueue.pushIntoQueue(clone);
				rej(e);
			});
		});
		e.respondWith(p);
		/*var p = new Promise((resolve, reject)=>{
			const r2= e.request.clone();
			fetch(e.request).then(res=>{
				resolve(res);
			}).catch(err=>{
				console.log("offline mode");
				goog.backgroundSyncQueue.pushIntoQueue(clone);
				reject(err);
			});
		});
		console.log("responding");
		e.respondWith(p);*/
	}
});


// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
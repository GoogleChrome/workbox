importScripts('../build/background-sync-queue.js')
console.log(goog);

//initialize bdQ
goog.backgroundSyncQueue.initialize()

self.addEventListener('fetch',function(e){
	if(e.request.url.startsWith("http://localhost:8080/api"))
	{
		const clone = e.request.clone();
		goog.backgroundSyncQueue.pushIntoQueue(clone);
	}
});
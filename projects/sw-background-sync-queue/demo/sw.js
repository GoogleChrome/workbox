importScripts('../build/background-sync-queue.js')
console.log(goog);

//initialize bdQ
goog.backgroundSyncQueue.initialize()

self.addEventListener('fetch',function(e){

});
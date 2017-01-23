# sw-background-sync-queue

A service worker implementation of the a queue which is triggered by the background sync event.

## Installation

`npm install --save-dev sw-background-sync-queue`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-background-sync-queue/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-background-sync-queue/demo/) directly.

## API

### sw-background-sync-queue

[packages/sw-background-sync-queue/src/index.js:19-19](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/index.js#L19-L19 "Source code on GitHub")

sw-background-sync-queue Module

### goog.backgroundSyncQueue.initialize

[packages/sw-background-sync-queue/src/index.js:37-43](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/index.js#L37-L43 "Source code on GitHub")

In order to use this library call `goog.backgroundSyncQueue.initialize()`.
It will take care of setting up IndexedDB for storing requests and broadcast
channel for communication of request creations. Also this attaches a handler
to `sync` event and replays the queued requeusts.

**Parameters**

-   `input` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** The input object to this function
    -   `input.dbName` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** The name of the db to store requests and
        responses
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.dbName`  

### BackgroundSyncQueue

[packages/sw-background-sync-queue/src/lib/background-sync-queue.js:56-124](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/lib/background-sync-queue.js#L56-L124 "Source code on GitHub")

Use the instance of this class to push the failed requests into the queue.

**Examples**

```javascript
// Case 1: When you want to push the requests manually
let bgQueue = new goog.backgroundSyncQueue.BackgroundSyncQueue();
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
// Case 2: When you want the higher level framework to take care of failed
requests
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

const requestWrapper = new goog.runtimeCaching.RequestWrapper({
	behaviors: [bgQueue],
});

const route = new goog.routing.ExpressRoute({
	path: '/*',
	origin: 'https://jsonplaceholder.typicode.com',
	handler: new goog.runtimeCaching.NetworkOnly({requestWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

#### constructor

[packages/sw-background-sync-queue/src/lib/background-sync-queue.js:70-94](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/lib/background-sync-queue.js#L70-L94 "Source code on GitHub")

Creates an instance of BackgroundSyncQueue with the given options

**Parameters**

-   `input` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** 
    -   `input.maxRetentionTime` **\[[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)]** Time for which a queued
        request will live in the queue(irespective of failed/success of replay) (optional, default `5days`)
    -   `input.callbacks` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Callbacks for successfull/ failed
        replay of a request
    -   `input.queueName` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Queue name inside db in which
        requests will be queued
    -   `input.broadcastChannel` **\[BroadcastChannel]** BroadcastChannel
        which will be used to publish messages when the request will be queued.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.maxRetentionTime`   (optional, default `maxAge`)
    -   `$0.callbacks`  
    -   `$0.queueName`  
    -   `$0.broadcastChannel`  

#### pushIntoQueue

[packages/sw-background-sync-queue/src/lib/background-sync-queue.js:105-108](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/lib/background-sync-queue.js#L105-L108 "Source code on GitHub")

This function pushes a given request into the IndexedDb Queue

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.request` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The request which is to be queued
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.request`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise which resolves when the request is pushed in
the queue

#### fetchDidFail

[packages/sw-background-sync-queue/src/lib/background-sync-queue.js:121-123](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/lib/background-sync-queue.js#L121-L123 "Source code on GitHub")

This function is a call wrapper over `pushIntoQueue` used by higher
level framework. If you are writting the fetch handler for background
sync manually, please ignore this.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.request` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The request which is to be queued
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.request`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise which resolves when the request is pushed in
the queue

### goog.backgroundSyncQueue.getResponse

[packages/sw-background-sync-queue/src/lib/response-manager.js:29-37](https://github.com/prateekbh/sw-helpers/blob/c1558c053c1cff74243a61c8248bb1d3fb8a3b8f/packages/sw-background-sync-queue/src/lib/response-manager.js#L29-L37 "Source code on GitHub")

This function returns the fetched response for the given id of the request

**Parameters**

-   `id` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The ID of the request given back by the broaadcast
    channel
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.id`  

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** response Fetched response of the request.

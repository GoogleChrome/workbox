# sw-appcache-behavior

A service worker implementation of the behavior defined in a page's App Cache manifest.

## Installation

`npm install --save-dev sw-appcache-behavior`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-appcache-behavior/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-appcache-behavior/demo/) directly.

## API

### goog.appCacheBehavior.fetch

[packages/sw-appcache-behavior/src/appcache-behavior-import.js:514-527](https://github.com/GoogleChrome/sw-helpers/blob/8769cb5ff7d131573fe90aafac4a6b2ba7991b41/packages/sw-appcache-behavior/src/appcache-behavior-import.js#L514-L527 "Source code on GitHub")

`goog.appCacheBehavior.fetch` is the main entry point to the library
from within service worker code.

The goal of the library is to provide equivalent behavior to AppCache
whenever possible. The one difference in how this library behaves compared to
a native AppCache implementation is that its client-side code will attempt to
fetch a fresh AppCache manifest once any cached version is older than 24
hours. This works around a
[major pitfall](http://alistapart.com/article/application-cache-is-a-douchebag#section6)
in the native AppCache implementation.

**Important**
In addition to calling `goog.appCacheBehavior.fetch()` from within your
service worker, you _must_ add the following to each HTML document that
contains an App Cache Manifest:

```html
<script src="path/to/client-runtime.js"
        data-service-worker="service-worker.js">
</script>
```

(The `data-service-worker` attribute is optional. If provided, it will
automatically call
[`navigator.serviceWorker.register()`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register)
for you.)

Once you've added `<script src="path/to/client-runtime.js"></script>` to
your HTML pages, you can use `goog.appCacheBehavior.fetch` within your
service worker script to get a `Response` suitable for passing to
[`FetchEvent.respondWidth()`](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith):

```js
// Import the library into the service worker global scope:
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
importScripts('path/to/appcache-behavior-import.js');

self.addEventListener('fetch', event => {
  event.respondWith(goog.appCacheBehavior.fetch(event).catch(error => {
    // Fallback behavior goes here, e.g. return fetch(event.request);
  }));
});
```

`goog.appCacheBehavior.fetch()` can be selectively applied to only a subset
of requests, to aid in the migration off of App Cache and onto a more
robust service worker implementation:

```js
// Import the library into the service worker global scope:
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
importScripts('path/to/appcache-behavior-import.js');

self.addEventListener('fetch', event => {
  if (event.request.url.match(/legacyRegex/)) {
    event.respondWith(goog.appCacheBehavior.fetch(event));
  } else {
    event.respondWith(goog.appCacheBehavior.fetch(event));
  }
});
```

**Parameters**

-   `event` **FetchEvent**

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>**

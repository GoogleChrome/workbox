# sw-appcache-behavior

A service worker implementation of the behavior defined in a page's App Cache manifest.

## Installation

`npm install --save-dev sw-appcache-behavior`

## Demo

Browse sample source code in the [demo directory](demo/), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-appcache-behavior/demo/) directly.

## API

### goog.legacyAppCacheBehavior

[projects/sw-appcache-behavior/src/appcache-behavior-import.js:493-506](https://github.com/GoogleChrome/sw-helpers/blob/a97d1aaafaaa6829255a525a5f6cb0b4c811e045/projects/sw-appcache-behavior/src/appcache-behavior-import.js#L493-L506 "Source code on GitHub")

`goog.legacyAppCacheBehavior` is the main entry point to the library
from within service worker code.

**Important**
In addition to calling `goog.legacyAppCacheBehavior` from within your
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
your HTML pages, you can use `goog.legacyAppCacheBehavior` within your
service worker script to get a Response`suitable for passing to
[`FetchEvent.respondWidth()\`](<https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith>):

```js
self.addEventListener('fetch', event => {
  event.respondWith(goog.legacyAppCacheBehavior(event).catch(error => {
    // Fallback behavior goes here, e.g. return fetch(event.request);
  }));
});
```

`goog.legacyAppCacheBehavior` can be selectively applied to only a subset
of requests, to aid in the migration off of App Cache and onto a more
robust service worker implementation:

```js
self.addEventListener('fetch', event => {
  if (event.request.url.match(/legacyRegex/)) {
    event.respondWith(goog.legacyAppCacheBehavior(event));
  } else {
    event.respondWith(robustServiceWorkerBehavior(event));
  }
});
```

**Parameters**

-   `event` **FetchEvent** 

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** 

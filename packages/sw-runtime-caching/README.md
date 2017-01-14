# sw-runtime-caching

A service worker helper library that implements various runtime caching strategies.

## Installation

`npm install --save-dev sw-runtime-caching`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-runtime-caching/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-runtime-caching/demo/) directly.

## API

### sw-runtime-caching

[packages/sw-runtime-caching/src/index.js:22-22](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/index.js#L22-L22 "Source code on GitHub")

sw-runtime-caching Module

### CacheFirst

[packages/sw-runtime-caching/src/lib/cache-first.js:34-57](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/cache-first.js#L34-L57 "Source code on GitHub")

**Extends Handler**

**Examples**

```javascript
// Set up a route to match any requests made for URLs that end in .txt
// The requests are handled with a cache-first strategy.
const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.CacheFirst(),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### CacheOnly

[packages/sw-runtime-caching/src/lib/cache-only.js:34-54](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/cache-only.js#L34-L54 "Source code on GitHub")

**Extends Handler**

**Examples**

```javascript
// Set up a route to match any requests made for URLs that end in .txt
// The requests are handled with a cache-only strategy.
const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.CacheOnly(),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### defaultCacheName

[packages/sw-runtime-caching/src/lib/constants.js:25-25](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/constants.js#L25-L25 "Source code on GitHub")

The default cache name, used by RequestWrapper when there's no name provided.
It combines a constant prefix with the `registration.scope` value associated
with the current service worker, ensuring that multiple service workers used
on the same origin will have different default caches.

### Handler

[packages/sw-runtime-caching/src/lib/handler.js:24-57](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/handler.js#L24-L57 "Source code on GitHub")

This a base class meant to be extended by other classes that implement
specific request strategies.

### NetworkFirst

[packages/sw-runtime-caching/src/lib/network-first.js:34-63](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/network-first.js#L34-L63 "Source code on GitHub")

**Extends Handler**

**Examples**

```javascript
// Set up a route to match any requests made for URLs that end in .txt
// The requests are handled with a network-first strategy.
const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.NetworkFirst(),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### NetworkOnly

[packages/sw-runtime-caching/src/lib/network-only.js:34-53](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/network-only.js#L34-L53 "Source code on GitHub")

**Extends Handler**

**Examples**

```javascript
// Set up a route to match any requests made for URLs that end in .txt
// The requests are handled with a network-only strategy.
const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.CacheFirst(),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### RequestWrapper

[packages/sw-runtime-caching/src/lib/request-wrapper.js:39-208](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/request-wrapper.js#L39-L208 "Source code on GitHub")

This class is used by the various subclasses of `Handler` to configure the
cache name and any desired behaviors, which is to say classes that implement
request lifecycle callbacks.

It automatically triggers any registered callbacks at the appropriate time.
The current set of behavior callbacks, along with the parameters they're
given and when they're called, is:

-   `cacheWillUpdate({request, response})`: Call prior to writing an entry
    to the cache, allowing the callback to decide whether or not the cache
    entry should be written.
-   `cacheDidUpdate({cacheName, oldResponse, newResponse})`: Called whenever
    an entry is written to the cache, given the callback a chance to notify
    clients about the update or implement cache expiration.
-   `fetchDidFail({request})`: Called whenever a network request fails.

### StaleWhileRevalidate

[packages/sw-runtime-caching/src/lib/stale-while-revalidate.js:34-61](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/stale-while-revalidate.js#L34-L61 "Source code on GitHub")

**Extends Handler**

**Examples**

```javascript
// Set up a route to match any requests made for URLs that end in .txt
// The requests are handled with a stale-while-revalidate strategy.
const route = new goog.routing.RegExpRoute({
  regExp: /\.txt$/,
  handler: new goog.runtimeCaching.StaleWhileRevalidate(),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### CacheFirst.handle

[packages/sw-runtime-caching/src/lib/cache-first.js:46-56](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/cache-first.js#L46-L56 "Source code on GitHub")

An implementation of a [cache-first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)
request strategy.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.event` **FetchEvent** The event that triggered the service
               worker's fetch handler.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.event`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The response, either from the cache,
         or if that isn't available, from the network.

### CacheOnly.handle

[packages/sw-runtime-caching/src/lib/cache-only.js:49-53](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/cache-only.js#L49-L53 "Source code on GitHub")

An implementation of a [cache-only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only)
request strategy.

The advantage to using this vs. directly calling `caches.match()` is that
it will use the cache configuration and trigger the behaviors defined in
the underlying `RequestWrapper`.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object wrapper for the underlying parameters.
    -   `input.event` **FetchEvent** The event that triggered the service
               worker's fetch handler.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.event`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The response from the cache.

### ErrorFactory

[lib/error-factory.js:21-53](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/lib/error-factory.js#L21-L53 "Source code on GitHub")

A simple class to make errors and to help with testing.

#### constructor

[lib/error-factory.js:26-28](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/lib/error-factory.js#L26-L28 "Source code on GitHub")

**Parameters**

-   `errors` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A object containing key value pairs where the key
    is the error name / ID and the value is the error message.

#### createError

[lib/error-factory.js:35-52](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/lib/error-factory.js#L35-L52 "Source code on GitHub")

**Parameters**

-   `name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The error name to be generated.
-   `thrownError` **\[[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)]** The thrown error that resulted in this
    message.

Returns **[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)** The generated error.

### constructor

[packages/sw-runtime-caching/src/lib/handler.js:32-38](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/handler.js#L32-L38 "Source code on GitHub")

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.requestWrapper` **\[[RequestWrapper](#requestwrapper)]** An optional `RequestWrapper`
               that is used to configure the cache name and request behaviors. If
               not provided, a new `RequestWrapper` using the
               [default cache name](#defaultCacheName) will be used.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.requestWrapper`  

### handle

[packages/sw-runtime-caching/src/lib/handler.js:54-56](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/handler.js#L54-L56 "Source code on GitHub")

An abstract method that each subclass must implement.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.event` **FetchEvent** The event that triggered the service
               worker's fetch handler.
    -   `input.params` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Additional parameters that might be passed
               in to the method. If used in conjunction with the `Route` class,
               then the return value from the `match` function in `Route` will
               be passed in via this parameter.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.event`  
    -   `$0.params`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** A response, obtained from whichever strategy
        is implemented.

### NetworkFirst.handle

[packages/sw-runtime-caching/src/lib/network-first.js:46-62](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/network-first.js#L46-L62 "Source code on GitHub")

An implementation of a [network first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache)
request strategy.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object wrapper for the underlying parameters.
    -   `input.event` **FetchEvent** The event that triggered the service
               worker's fetch handler.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.event`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The response from the network, or if that's
         not available, a previously cached response.

### NetworkOnly.handle

[packages/sw-runtime-caching/src/lib/network-only.js:48-52](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/network-only.js#L48-L52 "Source code on GitHub")

An implementation of a [network-only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only)
request strategy.

The advantage to using this vs. directly calling `fetch()` is that it will
trigger the behaviors defined in the underlying `RequestWrapper`.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object wrapper for the underlying parameters.
    -   `input.event` **FetchEvent** The event that triggered the service
               worker's fetch handler.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.event`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The response from the network.

### constructor

[packages/sw-runtime-caching/src/lib/request-wrapper.js:54-95](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/request-wrapper.js#L54-L95 "Source code on GitHub")

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object wrapper for the underlying parameters.
    -   `input.cacheName` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** The name of the cache to use for Handlers
               that involve caching. If none is provided, a default name that
               includes the current service worker scope will be used.
    -   `input.behaviors` **\[[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>]** Any behaviors that should be
               invoked.
    -   `input.fetchOptions` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Values passed along to the
               [`init`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch#Parameters)
               of all `fetch()` requests made by this wrapper.
    -   `input.matchOptions` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Values passed along to the
               [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match#Parameters)
               of all cache `match()` requests made by this wrapper.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.cacheName`  
    -   `$0.behaviors`  
    -   `$0.fetchOptions`  
    -   `$0.matchOptions`  

### getCache

[packages/sw-runtime-caching/src/lib/request-wrapper.js:101-106](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/request-wrapper.js#L101-L106 "Source code on GitHub")

Returns **Cache** An open `Cache` instance based on the configured
`cacheName`.

### match

[packages/sw-runtime-caching/src/lib/request-wrapper.js:116-121](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/request-wrapper.js#L116-L121 "Source code on GitHub")

Wraps `cache.match()`, using the previously configured cache name and match
options.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.request` **([Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** The key for the cache lookup.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.request`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The cached response.

### fetch

[packages/sw-runtime-caching/src/lib/request-wrapper.js:131-143](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/request-wrapper.js#L131-L143 "Source code on GitHub")

Wraps `fetch()`, and calls any `fetchDidFail` callbacks from the
registered behaviors if the request fails.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.request` **([Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** The request or URL to be fetched.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.request`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The network response.

### fetchAndCache

[packages/sw-runtime-caching/src/lib/request-wrapper.js:161-207](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/request-wrapper.js#L161-L207 "Source code on GitHub")

Combines both fetching and caching, using the previously configured options
and calling the appropriate behaviors.

By default, responses with a status of [2xx](https://fetch.spec.whatwg.org/#ok-status)
will be considered valid and cacheable, but this could be overridden by
configuring one or more behaviors that implement the `cacheWillUpdate`
lifecycle callback.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.request` **[Request](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/request)** The request to fetch.
    -   `input.waitOnCache` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** `true` means the method should wait
               for the cache.put() to complete before returning. The default value
               of `false` means return without waiting.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.request`  
    -   `$0.waitOnCache`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The network response.

### StaleWhileRevalidate.handle

[packages/sw-runtime-caching/src/lib/stale-while-revalidate.js:49-60](https://github.com/GoogleChrome/sw-helpers/blob/e4a49af2e45c216f880cd3399003202c2e57f37f/packages/sw-runtime-caching/src/lib/stale-while-revalidate.js#L49-L60 "Source code on GitHub")

An implementation of a [stale-while-revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate)
request strategy.

In addition to updating the appropriate caches, if will also trigger any
appropriate behaviors defined in the underlying `RequestWrapper`.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object wrapper for the underlying parameters.
    -   `input.event` **FetchEvent** The event that triggered the service
               worker's fetch handler.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.event`  

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Response](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)>** The response from the cache, if present, or
         from the network if not.

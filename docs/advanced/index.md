---
layout: index
title: Advanced
navigation_weight: 1
---

# Caching CDN Requests or Non-200 Responses

If an attempt is made to cache an asset that is on a different origin or
the asset returns a non-200 response, these modules will throw an error. 
This default behavior ensures that only good and local responses are
cached.

Support for external resources depends on how you use these libraries.

## sw-lib

In sw-lib, you can set up some additional options with a route that will allow
support for additional status codes and / or specific headers.

```javascript
const cdnCacheStrategy = goog.swlib.staleWhileRevalidate({
  cacheableResponse: {
    statuses: [0],
  },
});
goog.swlib.router.registerRoute(/http://cdn.mysite.com/styles/.*/, cdnCacheStrategy);
```

You can use the same approach with all of the caching strategies supported by
sw-lib including `cacheFirst()`, `cacheOnly()`, `networkFirst()`,
`networkOnly()` and `StaleWhileRevalidate()`.

## Lower Level Modules

In lower level modules, to cache a response for a status code other than 2XX
use the `sw-cacheable-response` plugin with a `RequestWrapper`.

```javascript
// The responses will be cached if the response code is 0, 200, or 404, and
// will not be cached otherwise.
const cacheablePlugin = new goog.cacheableResponse.Plugin({
  statuses: [0, 200, 404]
});

const requestWrapper = new goog.runtimeCaching.RequestWrapper({
  cacheName: 'runtime-cache',
  plugins: [
    cacheablePlugin
  ]
});

const route = new goog.routing.RegExpRoute({
  match: ({url}) => url.domain === 'example.com',
  handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper})
});
```

# Fine Grained Request Caching

If you need more than the ability to define static status and header values
you can create your own "plugin" which needs to implement the `cacheWillUpdate`
method. Wherever this plugin is used, it will be passed a
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object
and returning a boolean of true will result in the caching of the response,
other you prevent caching by returning false.

In sw-lib, this can be achieved like so:

```javascript
const myCacheablePlugin = {
  cacheWillUpdate: ({response}) => {
    // Or implement whatever other logic you want, e.g. check for 'x-no-sw: true'
    return response.headers.get('cache-control') !== 'no-cache';
  };
};
const customCacheCriteria = goog.swlib.staleWhileRevalidate({
  plugins: [
    myCacheablePlugin
  ],
});
goog.swlib.router.registerRoute('/some/url/', customCacheCriteria);
```

With the lower level modules you can use a custom plugin by passing it into
a request wrapper.

```javascript
const myCacheablePlugin = {
  cacheWillUpdate: ({response}) => {
    // Or implement whatever other logic you want, e.g. check for 'x-no-sw: true'
    return response.headers.get('cache-control') !== 'no-cache';
  };
};

const requestWrapper = new goog.runtimeCaching.RequestWrapper({
  cacheName: 'my-cache',
  plugins: [myCacheablePlugin],
});

const route = new goog.routing.RegExpRoute({
  regExp: new RegExp('^https://example.com/api/'),
  handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

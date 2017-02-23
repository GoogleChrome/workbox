---
layout: index
title: Advanced
navigation_weight: 1
---

# Caching CDN Requests or Non-200 Responses

If an attempt is made to cache an asset that is on a different origin or
the asset returns a non-200 response, these modules will throw an error. The
reason for this default behavior is to ensure that only good and local
responses are cached.

Depending on how you are using these libraries will depend on how you can add
support for external resources.

## sw-lib

In sw-lib, you can set up some additional options with a route that will allow
support for additional status codes and / or based on specific headers.

```javascript
const cdnCacheStrategy = goog.swlib.staleWhileRevalidate({
  cacheableResponse: {
    statuses: [0],
  },
});
goog.swlib.router.registerRoute(/http://cdn.mysite.com/styles/.*/, cdnCacheStrategy);
```

This same approach can be used with all of th caching strategies supported by
sw-lib including `cacheFirst()`, `cacheOnly()`, `networkFirst()`,
`networkOnly()` and `StaleWhileRevalidate()`.

## Lower Level Modules

To cache a response with a status code other than 2XX status code when using
the lower level modules use the `sw-cacheable-response` plugin with a
`RequestWrapper`.

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

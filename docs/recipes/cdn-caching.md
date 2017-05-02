---
layout: index
title: Caching CDN Requests or Non-200 Responses
navigation_weight: 3
---

# Caching CDN Requests or Non-200 Responses

If an attempt is made to cache an asset that is on a different origin or
the asset returns a non-200 response, these modules will throw an error. The
reason for this default behavior is to ensure that only good and local
responses are cached.

Below are examples of how to cache third party content in sw-lib and
the lower level modules.

## sw-lib

In sw-lib, you can set up some additional options with a route that will allow
custom status codes and / or responses with specific headers.

In sw-lib you can add options to caching strategies which support caching
responses with specific status codes, headers, or both.

```javascript
const cdnCacheStrategy = goog.swlib.staleWhileRevalidate({
  cacheableResponse: {
    statuses: [0, 200],
  },
});
goog.swlib.router.registerRoute(new RegExp('^https://cdn.mysite.com/styles/'), cdnCacheStrategy);
```

Use this approach with any of the caching strategies supported by
sw-lib including `cacheFirst()`, `cacheOnly()`, `networkFirst()`,
`networkOnly()` and `staleWhileRevalidate()`.

## Lower Level Modules

When using the lower level modules, use the `sw-cacheable-response` plugin
with a `RequestWrapper` to cache responses with a non 2XX status code.

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
you can create your own "plugin" which needs to implement the
`cacheWillUpdate` callback. Wherever this plugin is used, the `cacheWillUpdate`
callback will be executed with a
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object as
an argument. Your callback should return a boolean where returning true results
in the response being cached.

In sw-lib, this can be achieved like so:

```javascript
const myCustomPlugin = {
  cacheWillUpdate: ({response}) => {
    // Or implement whatever other logic you want, e.g. check for 'x-no-sw: true'
    return response.headers.get('cache-control') !== 'no-cache';
  };
};
const customCacheCriteria = goog.swlib.staleWhileRevalidate({
  plugins: [
    myCustomPlugin
  ],
});
goog.swlib.router.registerRoute('/some/url/', customCacheCriteria);
```

With the lower level modules use a custom plugin by passing it into
a request wrapper.

```javascript
const myCustomPlugin = {
  cacheWillUpdate: ({response}) => {
    // Or implement whatever other logic you want, e.g. check for 'x-no-sw: true'
    return response.headers.get('cache-control') !== 'no-cache';
  };
};

const requestWrapper = new goog.runtimeCaching.RequestWrapper({
  cacheName: 'my-cache',
  plugins: [myCustomPlugin],
});

const route = new goog.routing.RegExpRoute({
  regExp: new RegExp('^https://example.com/api/'),
  handler: new goog.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

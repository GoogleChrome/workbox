---
layout: index
title: Types of Requests
navigation_weight: 1
---
If an attempt is made to cache an asset that is on a different origin or
the asset returns a non-200 response, these modules will throw an error. The
reason for this default behavior is to ensure that only good and local
responses are cached.

To cache a response with a status code other than 2XX status code, you can
use the `sw-cacheable-response` plugin.

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

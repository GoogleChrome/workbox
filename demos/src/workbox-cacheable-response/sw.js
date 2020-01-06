importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});


const cacheable = new workbox.cacheableResponse.CacheableResponse({
  statuses: [200],
  headers: {
    'X-Is-Cacheable': 'true',
  },
});

const handleCachableResponse = (event) => {
  return fetch(event.request)
  .then((response) => {
    if (cacheable.isResponseCacheable(response)) {
      console.log("Response meets the criteria");
    } else {
      console.log("Response does NOT meet the criteria");
    }

    return response;
  });
};

self.addEventListener('fetch', (event) => {
  switch (new URL(event.request.url).pathname) {
    case '/api/is-response-cacheable':
      event.respondWith(handleCachableResponse(event));
      break;
  }
});

workbox.core.skipWaiting();
workbox.core.clientsClaim();
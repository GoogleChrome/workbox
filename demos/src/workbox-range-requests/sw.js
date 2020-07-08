importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.setConfig({
  debug: true,
});

workbox.routing.registerRoute(
    new RegExp('/range-request-example'),
    new workbox.strategies.CacheOnly({
      cacheName: 'range-requests-demo',
      plugins: [
        new workbox.rangeRequests.RangeRequestsPlugin(),
      ],
    }),
);

workbox.core.skipWaiting();
workbox.core.clientsClaim();

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});

const CACHE_NAME = 'my-cache';
const START_CACHE_KEY = 'start';
const END_CACHE_KEY = 'end';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all([
      cache.put(START_CACHE_KEY, new Response('<html><head></head><body>')),
      cache.put(END_CACHE_KEY, new Response('</body></html>')),
    ]);
  })());
});

// Use a stale-while-revalidate strategy as a source for part of the response.
const apiStrategy = new workbox.strategies.StaleWhileRevalidate({
  cacheName: 'apiStrategy',
});

// String together an artificially complex series of stream sources.
const streamsStrategy = workbox.streams.strategy([
  () => caches.match(START_CACHE_KEY, {cacheName: CACHE_NAME}),
  () => `<p>🎉 This <code>iframe</code> is composed of multiple streams.</p>`,
  () => `<p>Here's an API call, using a stale-while-revalidate strategy:</p>`,
  ({event}) => apiStrategy.handle({
    event: event,
    request: new Request('/api/date'),
  }),
  () => caches.match(END_CACHE_KEY, {cacheName: CACHE_NAME}),
]);

// Once the strategy is configured, the actual routing looks clean.
workbox.routing.registerRoute(
  new RegExp('iframe$'),
  streamsStrategy
);

workbox.core.skipWaiting();
workbox.core.clientsClaim();
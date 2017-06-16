/* eslint-env worker, serviceworker */
/* global workbox */

importScripts(
  '../build/importScripts/workbox-runtime-caching.dev.v1.0.0.js',
  '../../workbox-routing/build/importScripts/workbox-routing.dev.v1.0.0.js'
);

// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  self.skipWaiting();

  const partials = [
    'footer.html',
    'header.html',
    'page1.html',
    'page2.html',
  ].map((file) => `partials/${file}`);

  event.waitUntil(
    caches.open('partials').then((cache) => cache.addAll(partials))
  );
});
self.addEventListener('activate', () => self.clients.claim());

const route = new workbox.routing.RegExpRoute({
  regExp: /(\w+\.html)$/,
  handler: new workbox.runtimeCaching.StreamedComposite({streamSources: [
    () => caches.match(`partials/header.html`),
    ({params}) => new Promise((resolve) => setTimeout(
      () => caches.match(`partials/${params[0]}`).then(resolve), 1000)),
    ({params}) => new Promise((resolve) => setTimeout(
      () => caches.match(`partials/${params[0]}`).then(resolve), 2000)),
    () => caches.match(`partials/footer.html`),
  ]}),
});

const router = new workbox.routing.Router();
router.registerRoute({route});

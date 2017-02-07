/* global goog, sinon */
importScripts('/packages/sw-precaching/test/static/test-data.js');
importScripts('/node_modules/sinon/pkg/sinon.js');
importScripts('/packages/sw-precaching/build/sw-precaching.min.js');
importScripts('/packages/sw-precaching/test/static/skip-and-claim.js');

let requestsMade = [];

sinon.stub(self, 'fetch', (requestUrl) => {
  requestsMade.push(requestUrl);
  return Promise.resolve(new Response());
});

const precacheManager = new goog.precaching.UnrevisionedCacheManager();
goog.__TEST_DATA['duplicate-entries'].forEach((entries) => {
  precacheManager.addToCacheList({
    unrevisionedFiles: entries,
  });
});

self.addEventListener('install', (event) => {
  event.waitUntil(precacheManager.install());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(precacheManager.cleanup());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url === `${location.origin}/__api/get-requests-made/`) {
    return event.respondWith(
      new Response(JSON.stringify(requestsMade))
    );
  }
  event.respondWith(caches.match(event.request));
});

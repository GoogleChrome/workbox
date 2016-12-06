/* global goog, sinon */
importScripts('/packages/sw-precaching/test/browser-unit/data/test-data.js');
importScripts('/node_modules/sinon/pkg/sinon.js');
importScripts('/packages/sw-precaching/build/sw-precaching.min.js');
importScripts('/packages/sw-precaching/test/browser-unit/data/skip-and-claim.js');

let requestsMade = [];

sinon.stub(self, 'fetch', (requestUrl) => {
  requestsMade.push(requestUrl);
  return Promise.resolve(new Response());
});

const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
goog.__TEST_DATA['duplicate-entries'].forEach((entries) => {
  revisionedCacheManager.cache({
    revisionedFiles: entries,
  });
});

self.addEventListener('fetch', (event) => {
  if (event.request.url === `${location.origin}/__api/get-requests-made/`) {
    return event.respondWith(
      new Response(JSON.stringify(requestsMade))
    );
  }
  event.respondWith(caches.match(event.request));
});

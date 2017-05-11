/* global goog */

importScripts('../build/workbox-precaching.js');
importScripts('./manifest.123456.js');

const revCacheManager = new goog.precaching.RevisionedCacheManager();
revCacheManager.addToCacheList({revisionedFiles: self.__file_manifest});

const unrevCacheManager = new goog.precaching.UnrevisionedCacheManager();
unrevCacheManager.addToCacheList({
  unrevisionedFiles: [
    './example.html',
  ],
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      revCacheManager.install(),
      unrevCacheManager.install(),
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      revCacheManager.cleanup(),
      unrevCacheManager.cleanup(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
    .then((match) => {
      if (match) {
        return match;
      }

      return fetch(event.request);
    })
  );
});

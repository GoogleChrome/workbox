/* global goog */

importScripts('./sw-precaching.v0.0.13.min.js');
importScripts('./manifest.123456.js');

const revCacheManager = new goog.precaching.RevisionedCacheManager();
revCacheManager.addToCacheList(self.__file_manifest);

const unrevCacheManager = new goog.precaching.UnrevisionedCacheManager();
unrevCacheManager.addToCacheList({
  unrevisionedFiles: [
    '/',
    '/images/logo.png',
  ],
});

self.addEventListener('install', (event) => {
  const promiseChain = Promise.all([
    revCacheManager.install(),
    unrevCacheManager.install(),
  ]);
  event.waitUntil(promiseChain);
});

self.addEventListener('activate', (event) => {
  const promiseChain = Promise.all([
    revCacheManager.cleanup(),
    unrevCacheManager.cleanup(),
  ]);
  event.waitUntil(promiseChain);
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

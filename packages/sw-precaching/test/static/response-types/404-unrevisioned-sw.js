/* global goog */
importScripts('/packages/sw-precaching/test/static/test-data.js');
importScripts('/packages/sw-precaching/build/sw-precaching.min.js');
importScripts('/packages/sw-precaching/test/static/skip-and-claim.js');

const precacheManager = new goog.precaching.PrecacheManager();
precacheManager.cacheUnrevisioned({
  unrevisionedFiles: [
    '/__test/404/',
  ],
});

/* eslint-env worker, serviceworker */
/* global goog */

importScripts('../../build/appcache-behavior-import.js');

self.addEventListener('install', (event) =>
  event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (event) => {
  event.respondWith(goog.appCacheBehavior.fetch(event));
});

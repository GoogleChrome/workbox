/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');

if (!workbox.core.cacheNames.googleAnalytics) {
  throw new Error(`cacheNames.googleAnalytics is not defined`);
}
if (!workbox.core.cacheNames.precache) {
  throw new Error(`cacheNames.precache is not defined`);
}
if (!workbox.core.cacheNames.runtime) {
  throw new Error(`cacheNames.runtime is not defined`);
}
if (!workbox.core.cacheNames.prefix) {
  throw new Error(`cacheNames.prefix is not defined`);
}
if (!workbox.core.cacheNames.suffix) {
  throw new Error(`cacheNames.suffix is not defined`);
}

if (!workbox.core.setCacheNameDetails) {
  throw new Error('setCacheNameDetails() is not defined.');
}

addEventListener('install', (event) => event.waitUntil(skipWaiting()));
addEventListener('activate', (event) => event.waitUntil(clients.claim()));

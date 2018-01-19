importScripts('/__WORKBOX/buildFile/workbox-core');

/* globals workbox */

// Test log levels
if (typeof workbox.core.LOG_LEVELS.debug !== 'number') {
  throw new Error('LOG_LEVELS.debug isnt a number');
}
if (typeof workbox.core.LOG_LEVELS.log !== 'number') {
  throw new Error('LOG_LEVELS.log isnt a number');
}
if (typeof workbox.core.LOG_LEVELS.warn !== 'number') {
  throw new Error('LOG_LEVELS.warn isnt a number');
}
if (typeof workbox.core.LOG_LEVELS.error !== 'number') {
  throw new Error('LOG_LEVELS.error isnt a number');
}
if (typeof workbox.core.LOG_LEVELS.silent !== 'number') {
  throw new Error('LOG_LEVELS.silent isnt a number');
}

if (!workbox.core.setLogLevel) {
  throw new Error('setLogLevel() is not defined.');
}

// Dev will have log, prod will have warn
if (workbox.core.logLevel !== workbox.core.LOG_LEVELS.log &&
  workbox.core.logLevel !== workbox.core.LOG_LEVELS.warn) {
  throw new Error('Default logLevel is not log.');
}

if (!workbox.core.cacheNames.googleAnalytics) {
  throw new Error(`cacheNames.googleAnalytics is not defined`);
}
if (!workbox.core.cacheNames.precache) {
  throw new Error(`cacheNames.precache is not defined`);
}
if (!workbox.core.cacheNames.runtime) {
  throw new Error(`cacheNames.runtime is not defined`);
}

if (!workbox.core.setCacheNameDetails) {
  throw new Error('setCacheNameDetails() is not defined.');
}

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

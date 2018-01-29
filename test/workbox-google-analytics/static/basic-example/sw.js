importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-background-sync');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');
importScripts('/__WORKBOX/buildFile/workbox-google-analytics');

/* globals workbox */

workbox.googleAnalytics.initialize();

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

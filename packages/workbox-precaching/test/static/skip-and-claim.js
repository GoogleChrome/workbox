workbox.logLevel = self.workbox.LOG_LEVEL.verbose;

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

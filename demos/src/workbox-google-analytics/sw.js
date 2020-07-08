importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.setConfig({
  debug: true,
});


workbox.googleAnalytics.initialize();

workbox.core.skipWaiting();
workbox.core.clientsClaim();

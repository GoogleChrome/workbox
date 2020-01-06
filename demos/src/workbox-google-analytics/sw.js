importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});


workbox.googleAnalytics.initialize();

workbox.core.skipWaiting();
workbox.core.clientsClaim();
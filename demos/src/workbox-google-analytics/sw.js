importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js',
);

workbox.setConfig({
  debug: true,
});

workbox.googleAnalytics.initialize();

workbox.core.skipWaiting();
workbox.core.clientsClaim();

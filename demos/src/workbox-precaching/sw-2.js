importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});

workbox.precaching.precacheAndRoute([
  {url: '/', revision: '2'},
  {url: 'public/test-file.txt', revision: '2'},
  'public/hello-world.5678.txt',
]);
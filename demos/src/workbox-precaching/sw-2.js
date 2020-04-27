importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.setConfig({
  debug: true,
});

workbox.precaching.precacheAndRoute([
  {url: '/', revision: '2'},
  {url: 'test-file.txt', revision: '2'},
  'hello-world.5678.txt',
]);

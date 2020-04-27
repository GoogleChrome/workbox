importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.setConfig({
  debug: true,
});

workbox.precaching.precacheAndRoute([
  {url: '/', revision: '1'},
  {url: 'test-file.txt', revision: '1'},
  'hello-world.1234.txt',
]);

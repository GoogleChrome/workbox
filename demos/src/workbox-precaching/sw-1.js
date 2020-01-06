importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});

workbox.precaching.precacheAndRoute([
  {url: '/', revision: '1'},
  {url: 'public/test-file.txt', revision: '1'},
  'public/hello-world.1234.txt',
]);
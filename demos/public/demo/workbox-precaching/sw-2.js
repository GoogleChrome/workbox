importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0-alpha.17/workbox-sw.dev.js');

const wb = new WorkboxSW({
  debug: true,
});

wb.precaching.precache([
  {url: '/demo/workbox-precaching', revision: '2'},
  'test-file.txt',
  'hello-world.5678.txt',
]);

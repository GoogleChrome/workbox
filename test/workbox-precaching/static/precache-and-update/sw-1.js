importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-precaching');

/* globals workbox */

workbox.precaching.default.precache([
  {
    url: 'styles/index.css',
    revision: '1',
  }, {
    url: 'index.html',
    revision: '1',
  },
]);

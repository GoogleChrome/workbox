importScripts(
  '/__test/bundle/workbox-precaching',
  '/__test/bundle/workbox-routing',
  '/__test/bundle/workbox-runtime-caching'
);

/* global goog */

const revcacheManager = new goog.precaching.RevisionedCacheManager();
revcacheManager.addToCacheList({revisionedFiles: [
  {url: 'example.html', revision: '1234'},
]});

const cacheName = revcacheManager.getCacheName();
const cachedURLs = revcacheManager.getCachedUrls();

const route = new goog.routing.Route({
  match: ({url, event}) => {
    return (cachedURLs.indexOf(url.href) !== -1);
  },
  handler: new goog.runtimeCaching.CacheFirst({
    requestWrapper: new goog.runtimeCaching.RequestWrapper({
      cacheName: cacheName,
    }),
  }),
});

const router = new goog.routing.Router();
router.registerRoute({route});

self.addEventListener('install', (event) => {
  event.waitUntil(revcacheManager.install());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(revcacheManager.cleanup());
});

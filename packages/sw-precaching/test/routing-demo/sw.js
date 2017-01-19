importScripts('/packages/sw-precaching/build/sw-precaching.min.js');
importScripts('/packages/sw-precaching/node_modules/sw-routing/build/sw-routing.min.js');
importScripts('/packages/sw-precaching/node_modules/sw-runtime-caching/build/sw-runtime-caching.min.js');

/* global goog */

const cacheManager = new goog.precaching.PrecacheManager();
cacheManager.cacheRevisioned({revisionedFiles: [
  {url: 'example.html', revision: '1234'},
]});

const revisionedCacheManager = cacheManager.getRevisionedCacheManager();
const cacheName = revisionedCacheManager.getCacheName();
const cachedURLs = revisionedCacheManager.getCachedUrls();

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

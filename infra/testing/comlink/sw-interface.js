/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/comlink.js');

// TODO: Standardize on naming, and move over some of the legacy uses of
// postMessage() to this new approach.
// These are all the methods that will be called in the SW, but are exposed in
// the window context via Comlink.
const api = {
  cachesKeys: () => {
    return caches.keys();
  },

  clearAllCaches: async () => {
    const keys = await caches.keys();
    return Promise.all(keys.map((key) => caches.delete(key)));
  },

  doesDbExist: (dbName) => {
    return new Promise((resolve) => {
      const result = indexedDB.open(dbName);
      result.onupgradeneeded = (event) => {
        event.target.transaction.abort();
        event.target.result.close();
        resolve(false);
      };
      result.onsuccess = (event) => {
        event.target.result.close();
        resolve(true);
      };
    });
  },

  getObjectStoreEntries: (dbName, objStoreName) => {
    return new Promise((resolve) => {
      const result = indexedDB.open(dbName);
      result.onsuccess = (event) => {
        const db = event.target.result;
        db
          .transaction(objStoreName)
          .objectStore(objStoreName)
          .getAll().onsuccess = (event) => {
          resolve(event.target.result);
        };
      };
    });
  },

  cacheURLs: async (cacheName) => {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    return requests.map((request) => request.url);
  },

  getCachedResponseText: async (cacheName, url) => {
    const cache = await caches.open(cacheName);
    const response = await cache.match(url);
    return response.text();
  },

  isNavigationPreloadSupported: async () => {
    return workbox.navigationPreload.isSupported();
  },
};

self.addEventListener('message', (event) => {
  if (event.data instanceof MessagePort) {
    Comlink.expose(api, event.data);
    event.data.start();
  }
});

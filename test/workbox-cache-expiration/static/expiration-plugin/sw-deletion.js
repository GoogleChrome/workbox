importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-cache-expiration');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-strategies');

const expirationPlugin = new workbox.expiration.Plugin({
  maxEntries: 1,
});

const cacheName = 'expiration-plugin-deletion';

workbox.routing.registerRoute(
  /.*.txt/,
  workbox.strategies.cacheFirst({
    cacheName,
    plugins: [
      expirationPlugin,
    ],
  })
);

const doesDbExist = () => {
  return new Promise((resolve) => {
    const result = indexedDB.open(cacheName);
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
};

self.addEventListener('message', async (event) => {
  let message;

  if (event.data === 'delete') {
    try {
      await expirationPlugin.deleteCacheAndMetadata();
    } catch (error) {
      message = error.message;
    }
  } else if (event.data === 'doesDbExist') {
    message = await doesDbExist(cacheName);
  }

  // Send all open clients a message indicating that deletion is done.
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage(message);
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

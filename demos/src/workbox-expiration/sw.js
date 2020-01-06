importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

// Note: Ignore the error that Glitch raises about workbox being undefined.
workbox.setConfig({
  debug: true
});

const expirationManager = new workbox.expiration.CacheExpiration(
  'demo-cache-for-expiration', {
    maxEntries: 3,
    maxAgeSeconds: 30,
  });

const updateEntry = async (entryID) => {
  const openCache = await caches.open('demo-cache-for-expiration');
  
  openCache.put(
    `example-entry-${entryID}`,
    new Response(`Hello from entry number ${entryID}`)
  );
  
  expirationManager.updateTimestamp(`example-entry-${entryID}`);
};

self.addEventListener('message', (event) => {
  switch(event.data.command) {
    case 'update-entry':
      updateEntry(event.data.id);
      break;
    case 'expire-entries':
      expirationManager.expireEntries();
      break;
    default:
      console.log(`Unknown command received in the service worker: `, event);
  }
});
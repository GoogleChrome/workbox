importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});


const broadcastUpdate = new workbox.broadcastUpdate.BroadcastCacheUpdate(
  "broadcast-update-demo"
);

const initialResponse = new Response('Response 1', {
  headers: {
    'last-modified': Date.now().toString(),
  }
});

self.addEventListener('message', (event) => {
  switch(event.data.command) {
    case 'trigger-broadcast':
      const secondResponse = new Response('Response 2', {
        headers: {
          'last-modified': Date.now().toString(),
        }
      });
      
      broadcastUpdate.notifyIfUpdated({
        oldResponse: initialResponse,
        newResponse: secondResponse,
        request: new Request("exampleUrl"),
        url: "exampleUrl",
        cacheName: "exampleCacheName"
      });
      break;
    default:
      console.log(`Unknown command received in the service worker: `, event);
  }
});

workbox.core.skipWaiting();
workbox.core.clientsClaim();
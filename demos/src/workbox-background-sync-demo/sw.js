importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js',
);

// Note: Ignore the error that Glitch raises about workbox being undefined.
workbox.setConfig({
  debug: true,
});

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin(
  'myQueueName',
);

workbox.routing.registerRoute(
  ({url}) => url.pathname === '/example.txt',
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
);

workbox.core.skipWaiting();
workbox.core.clientsClaim();

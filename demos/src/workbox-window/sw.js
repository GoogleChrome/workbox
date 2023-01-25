importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js',
);

workbox.setConfig({
  debug: true,
});

const SW_VERSION = '5.0.0';

addEventListener('message', (event) => {
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage(SW_VERSION);
  }
});

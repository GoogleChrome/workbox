importScripts('./sample-import.js');

const precache = (input) => {
  // no-op
};

precache([]);

// The automatic injection will happen here:
workbox.precaching.precacheAndRoute([]);

// Then, call precache again:
workbox.precaching.precacheAndRoute([
  '/extra-assets/example.1234.css',
  '/extra-assets/example-2.1234.js',
]);

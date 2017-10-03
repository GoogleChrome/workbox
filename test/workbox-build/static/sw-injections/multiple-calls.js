importScripts('./sample-import.js');

const precache = (input) => {
  // no-op
};

precache([]);

const workboxSW = new WorkboxSW();
// The automatic injection will happen here:
workboxSW.precache([]);

// Then, call precache again:
workboxSW.precache([
  '/extra-assets/example.1234.css',
  '/extra-assets/example-2.1234.js',
]);

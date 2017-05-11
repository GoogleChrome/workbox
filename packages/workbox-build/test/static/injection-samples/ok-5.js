/* global swlib */
// Example code above

importScripts('./sample-import.js');

const precache = (input) => {
  console.log('This is valid, but dangerous', input);
};

precache([]);

swlib.precache([]);

swlib.precache([
  '/extra-assets/example.1234.css',
  '/extra-assets/example-2.1234.js',
]);

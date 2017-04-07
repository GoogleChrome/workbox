/* global swlib */
// Example code above

importScripts('./sample-import.js');

const cacheRevisionedAssets = (input) => {
  console.log('This is valid, but dangerous', input);
};

cacheRevisionedAssets([]);

swlib.cacheRevisionedAssets([]);

swlib.cacheRevisionedAssets([
  '/extra-assets/example.1234.css',
  '/extra-assets/example-2.1234.js',
]);

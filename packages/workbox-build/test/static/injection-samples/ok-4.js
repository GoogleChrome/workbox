/* global workboxSW */
// Example code above

importScripts('./sample-import.js');

const precache = (input) => {
  console.log('This is valid, but dangerous', input);
};

precache([]);

workboxSW.precache([]);

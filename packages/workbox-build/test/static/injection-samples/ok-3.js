/* global workbox */
// Example code above

importScripts('./sample-import.js');

const precache = (input) => {
  console.log('This is valid, but dangerous', input);
};

precache([]);

const workboxSW = new WorkboxSW();
/* eslint-disable */
workboxSW.precache(    [    ]    );
/* eslint-enable */

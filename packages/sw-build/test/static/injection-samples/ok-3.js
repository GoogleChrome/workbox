/* global goog */
// Example code above

importScripts('./sample-import.js');

const precache = (input) => {
  console.log('This is valid, but dangerous', input);
};

precache([]);

const swlib = new goog.SWLib();
swlib.precache(    [    ]    );

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('./sample-import.js');

const precache = (input) => {
  // no-op
};

precache([]);

// The automatic injection will happen here:
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Then, call precache again:
workbox.precaching.precacheAndRoute([
  '/extra-assets/example.1234.css',
  '/extra-assets/example-2.1234.js',
]);

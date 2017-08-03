importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/node_modules/sinon/pkg/sinon-no-sourcemaps.js');

/* globals mocha */
/* eslint-disable no-unused-vars */

self.expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

// This is a bit of a hack, but means workbox-runtime-caching can
// stub out fetch without triggering a mocha global leak.
// This thread inspired this "solution":
// https://github.com/sinonjs/sinon/issues/143
self.fetch = fetch;

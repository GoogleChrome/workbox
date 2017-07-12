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
  // Lets sinon stub these globals without triggering a mocha leak warning.
  globals: ['fetch', 'addEventListener'],
});

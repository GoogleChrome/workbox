importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/__test/bundle/workbox-sw');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test Library Surface', function() {
  it('should be accessible via goog.SWLib', function() {
    expect(goog.SWLib).to.exist;
  });

  it('should be able to construct goog.SWLib without error', function() {
    new goog.SWLib();
  });
});

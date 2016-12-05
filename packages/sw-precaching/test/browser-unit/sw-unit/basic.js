importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/browser/mocha-utils.js');

importScripts('/packages/sw-precaching/build/sw-precaching.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test Library Surface', function() {
  it('should be accessible via goog.precaching', function() {
    expect(goog.precaching).to.exist;
  });

  // TODO Test options
  it('should have RevisionedCacheManager via goog.precaching', function() {
    expect(goog.precaching.RevisionedCacheManager).to.exist;
  });
});

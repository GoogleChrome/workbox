importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test swlib.cacheOnly', function() {
  it('should be accessible goog.swlib.cacheOnly', function() {
    expect(goog.swlib.cacheOnly).to.exist;
  });
});

describe('Test swlib.cacheFirst', function() {
  it('should be accessible goog.swlib.cacheFirst', function() {
    expect(goog.swlib.cacheFirst).to.exist;
  });
});

describe('Test swlib.networkOnly', function() {
  it('should be accessible goog.swlib.networkOnly', function() {
    expect(goog.swlib.networkOnly).to.exist;
  });
});

describe('Test swlib.networkFirst', function() {
  it('should be accessible goog.swlib.networkFirst', function() {
    expect(goog.swlib.networkFirst).to.exist;
  });
});

describe('Test swlib.fastest', function() {
  it('should be accessible goog.swlib.fastest', function() {
    expect(goog.swlib.fastest).to.exist;
  });
});

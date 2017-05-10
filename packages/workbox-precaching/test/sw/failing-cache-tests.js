importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/packages/workbox-precaching/test/static/test-data.js');
importScripts('/__test/bundle/workbox-precaching');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test Failing Cache Behavior', function() {
  it('should fail to install revisioned with 404 cache request', function() {
    const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
    revisionedCacheManager.addToCacheList({
      revisionedFiles: [
        '/__test/404/',
      ],
    });
    return revisionedCacheManager.install()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
    });
  });

  it('should fail to install unrevisioned with 404 cache request', function() {
    const unrevisionedCacheManager = new goog.precaching.UnrevisionedCacheManager();
    unrevisionedCacheManager.addToCacheList({
      unrevisionedFiles: [
        '/__test/404/',
      ],
    });
    return unrevisionedCacheManager.install()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
    });
  });

  it('should fail to cache revisioned opaque responses by default', function() {
    const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
    revisionedCacheManager.addToCacheList({
      revisionedFiles: goog.__TEST_DATA['opaque'],
    });
    return revisionedCacheManager.install()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
    });
  });

  it('should fail to cache unrevisioned opaque responses by default', function() {
    const unrevisionedCacheManager = new goog.precaching.UnrevisionedCacheManager();
    unrevisionedCacheManager.addToCacheList({
      unrevisionedFiles: goog.__TEST_DATA['opaque'],
    });
    return unrevisionedCacheManager.install()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
    });
  });
});

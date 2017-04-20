importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-precaching/build/sw-precaching.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test cacheId Parameter', function() {
  let cacheManager;

  afterEach(function() {
    if (cacheManager) {
      cacheManager._close();
    }
    cacheManager = null;
  });

  it('should throw on bad cacheId input', function() {
    let thrownError;
    try {
      cacheManager = new goog.precaching.RevisionedCacheManager({
        cacheId: {},
      });
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('bad-cache-id');
  });

  it('should be able to generate cacheManager with cacheId', function() {
    const CACHE_ID = 'Cache_ID_Example';
    cacheManager = new goog.precaching.RevisionedCacheManager({
      cacheId: CACHE_ID,
    });
    cacheManager.getCacheName().indexOf(CACHE_ID).should.not.equal(-1);
  });
});

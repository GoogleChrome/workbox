importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-precaching');
importScripts('/packages/workbox-precaching/test/static/test-data.js');

describe('Test Failing Cache Behavior', function() {
  it('should fail to install revisioned with 404 cache request', function() {
    const revisionedCacheManager = new workbox.precaching.RevisionedCacheManager();
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
      expect(err.extras.url).to.equal(new URL('/__test/404/', self.location).toString());
    });
  });

  it.skip('should fail to install unrevisioned with 404 cache request', function() {
    const unrevisionedCacheManager = new workbox.precaching.UnrevisionedCacheManager();
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
      expect(err.extras.url).to.equal(new URL('/__test/404/', self.location).toString());
    });
  });

  it('should fail to cache revisioned opaque responses by default', function() {
    const revisionedCacheManager = new workbox.precaching.RevisionedCacheManager();
    revisionedCacheManager.addToCacheList({
      revisionedFiles: workbox.__TEST_DATA['opaque'],
    });
    return revisionedCacheManager.install()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
      expect(err.extras.url).to.equal(new URL(workbox.__TEST_DATA['opaque'][0], self.location).toString());
    });
  });

  it.skip('should fail to cache unrevisioned opaque responses by default', function() {
    const unrevisionedCacheManager = new workbox.precaching.UnrevisionedCacheManager();
    unrevisionedCacheManager.addToCacheList({
      unrevisionedFiles: workbox.__TEST_DATA['opaque'],
    });
    return unrevisionedCacheManager.install()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
      expect(err.extras.url).to.equal(new URL(workbox.__TEST_DATA['opaque'][0], self.location).toString());
    });
  });
});

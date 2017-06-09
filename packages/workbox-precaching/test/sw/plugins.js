importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-precaching');

describe('Test plugins Parameter', function() {
  it('should pass the provided plugins configuration along to the RequestWrapper', function() {
    // Register two dummy fetchDidFail plugins, and one dummy cacheWillUpdate.
    const cacheManager = new workbox.precaching.RevisionedCacheManager({
      plugins: [{
        fetchDidFail: () => {},
        cacheWillUpdate: () => {},
      }, {
        fetchDidFail: () => {},
      }],
    });

    expect(cacheManager._requestWrapper.plugins.size).to.eql(2);
    expect(cacheManager._requestWrapper.plugins.get('fetchDidFail').length).to.eql(2);
    expect(cacheManager._requestWrapper.plugins.get('cacheWillUpdate').length).to.eql(1);
  });
});

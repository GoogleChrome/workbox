importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/packages/sw-precaching/build/sw-precaching.js');

/* global goog */

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test plugins Parameter', function() {
  it('should pass the provided plugins configuration along to the RequestWrapper', function() {
    // Register two dummy fetchDidFail plugins, and one dummy cacheWillUpdate.
    const cacheManager = new goog.precaching.RevisionedCacheManager({
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

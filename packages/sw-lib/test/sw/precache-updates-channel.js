importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sinon/pkg/sinon.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-lib/build/sw-lib.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('precacheUpdatesChannel parameter', function() {
  it('should create a BroadcastCacheUpdatePlugin using the default channelName when precacheUpdatesChannel is undefined', function() {
    const swlib = new goog.SWLib();
    const plugins = swlib._revisionedCacheManager._requestWrapper.plugins;
    expect(plugins.has('cacheDidUpdate')).to.be.true;

    const broadcastCacheUpdatePlugin = plugins.get('cacheDidUpdate')[0];
    expect(broadcastCacheUpdatePlugin.channelName).to.eql('precache-updates');
  });

  it('should create a BroadcastCacheUpdatePlugin using the provided precacheUpdatesChannel as the channelName', function() {
    const precacheUpdatesChannel = 'my-test-channel';
    const swlib = new goog.SWLib({precacheUpdatesChannel});
    const plugins = swlib._revisionedCacheManager._requestWrapper.plugins;
    expect(plugins.has('cacheDidUpdate')).to.be.true;

    const broadcastCacheUpdatePlugin = plugins.get('cacheDidUpdate')[0];
    expect(broadcastCacheUpdatePlugin.channelName).to.eql(precacheUpdatesChannel);
  });

  for (let precacheUpdatesChannel of [null, false, '']) {
    it(`should not create a BroadcastCacheUpdatePlugin when precacheUpdatesChannel is ${precacheUpdatesChannel}`, function() {
      const swlib = new goog.SWLib({precacheUpdatesChannel});
      const plugins = swlib._revisionedCacheManager._requestWrapper.plugins;
      expect(plugins.has('cacheDidUpdate')).to.be.false;
    });
  }
});

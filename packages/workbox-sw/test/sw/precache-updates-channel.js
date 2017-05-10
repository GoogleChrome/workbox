importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sinon/pkg/sinon-no-sourcemaps.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/sw-lib'
);

/* global goog */

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('precacheChannelName parameter', function() {
  it('should create a BroadcastCacheUpdatePlugin using the default channelName when precacheChannelName is undefined', function() {
    const swlib = new goog.SWLib();
    const plugins = swlib._revisionedCacheManager._requestWrapper.plugins;
    expect(plugins.has('cacheDidUpdate')).to.be.true;

    const broadcastCacheUpdatePlugin = plugins.get('cacheDidUpdate')[0];
    expect(broadcastCacheUpdatePlugin.channelName).to.eql('precache-updates');
  });

  it('should create a BroadcastCacheUpdatePlugin using the provided precacheChannelName as the channelName', function() {
    const precacheChannelName = 'my-test-channel';
    const swlib = new goog.SWLib({precacheChannelName});
    const plugins = swlib._revisionedCacheManager._requestWrapper.plugins;
    expect(plugins.has('cacheDidUpdate')).to.be.true;

    const broadcastCacheUpdatePlugin = plugins.get('cacheDidUpdate')[0];
    expect(broadcastCacheUpdatePlugin.channelName).to.eql(precacheChannelName);
  });

  for (let precacheChannelName of [null, false, '']) {
    it(`should not create a BroadcastCacheUpdatePlugin when precacheChannelName is ${precacheChannelName}`, function() {
      const swlib = new goog.SWLib({precacheChannelName});
      const plugins = swlib._revisionedCacheManager._requestWrapper.plugins;
      expect(plugins.has('cacheDidUpdate')).to.be.false;
    });
  }
});

importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-broadcast-cache-update/build/sw-broadcast-cache-update.min.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the Behavior class', function() {
  const channelName = 'test-channel';
  const headersToCheck = ['one', 'two'];
  const source = 'test-source';

  it(`should throw when Behavior() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new goog.broadcastCacheUpdate.Behavior();
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('channel-name-required');
  });

  it(`should use the channelName from the constructor`, function() {
    const behavior = new goog.broadcastCacheUpdate.Behavior({channelName});
    expect(behavior.channelName).to.equal(channelName);
  });

  it(`should use the headersToCheck from the constructor`, function() {
    const behavior = new goog.broadcastCacheUpdate.Behavior({channelName, headersToCheck});
    expect(behavior.headersToCheck).to.equal(headersToCheck);
  });

  it(`should use a default value for headersToCheck when one isn't provided`, function() {
    const behavior = new goog.broadcastCacheUpdate.Behavior({channelName});
    expect(behavior.headersToCheck).to.not.be.empty;
  });

  it(`should use the source from the constructor`, function() {
    const behavior = new goog.broadcastCacheUpdate.Behavior({channelName, source});
    expect(behavior.source).to.equal(source);
  });

  it(`should use a default value for source when one isn't provided`, function() {
    const behavior = new goog.broadcastCacheUpdate.Behavior({channelName});
    expect(behavior.source).to.not.be.empty;
  });

  it(`should create and reuse a BroadcastChannel based on channelName`, function() {
    const behavior = new goog.broadcastCacheUpdate.Behavior({channelName});
    const broadcastChannel = behavior.channel;
    expect(broadcastChannel).to.be.instanceof(BroadcastChannel);
    // behavior.channel is a getter that create a BroadcastChannel the first
    // time it's called, and this test confirms that it returns the same
    // BroadcastChannel object when called twice.
    expect(broadcastChannel).to.eql(behavior.channel);
    expect(broadcastChannel.name).to.equal(channelName);
  });
});

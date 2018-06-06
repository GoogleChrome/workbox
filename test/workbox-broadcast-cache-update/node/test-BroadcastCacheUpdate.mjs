import {expect} from 'chai';
import * as sinon from 'sinon';

import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';

import {BroadcastCacheUpdate} from '../../../packages/workbox-broadcast-cache-update/BroadcastCacheUpdate.mjs';

describe(`[workbox-broadcast-cache-udpate] BroadcastCacheUpdate`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`constructor()`, function() {
    devOnly.it(`should throw without any parameters`, function() {
      return expectError(() => {
        new BroadcastCacheUpdate();
      }, 'channel-name-required');
    });

    it(`should use the channelName`, function() {
      const channelName = 'channel-name';
      const bcu = new BroadcastCacheUpdate(channelName);
      expect(bcu._channelName).to.equal(channelName);
    });

    it(`should use the headersToCheck from the constructor`, function() {
      const headersToCheck = [
        'hello-1',
        'hello-2',
      ];
      const bcu = new BroadcastCacheUpdate('channel-name', {headersToCheck});
      expect(bcu._headersToCheck).to.equal(headersToCheck);
    });

    it(`should use a default value for headersToCheck when one isn't provided`, function() {
      const bcu = new BroadcastCacheUpdate('channel-name');
      expect(bcu._headersToCheck).to.not.be.empty;
    });

    it(`should use the source from the constructor`, function() {
      const source = 'custom-source';
      const bcu = new BroadcastCacheUpdate('channel-name', {source});
      expect(bcu._source).to.equal(source);
    });

    it(`should use a default value for source when one isn't provided`, function() {
      const bcu = new BroadcastCacheUpdate('channel-name');
      expect(bcu._source).to.not.be.empty;
    });
  });

  describe(`_getChannel`, function() {
    it(`should create and reuse a BroadcastChannel based on channelName`, function() {
      const channelName = 'channel-name';
      const bcu = new BroadcastCacheUpdate(channelName);
      const broadcastChannel = bcu._getChannel();
      expect(broadcastChannel).to.be.instanceof(BroadcastChannel);

      // bcu.channel is a getter that create a BroadcastChannel the first
      // time it's called, and this test confirms that it returns the same
      // BroadcastChannel object when called twice.
      expect(broadcastChannel).to.eql(bcu._getChannel());
      expect(broadcastChannel.name).to.equal(channelName);
    });
  });

  describe(`notifyIfUpdated()`, function() {
    it('should broadcast update if responses are different', function() {
      const channelName = 'channel-name';
      const bcu = new BroadcastCacheUpdate(channelName);
      const channel = bcu._getChannel();
      sandbox.spy(channel, 'postMessage');

      bcu.notifyIfUpdated(new Response('', {
        headers: {
          'content-length': 0,
        },
      }), new Response('', {
        headers: {
          'content-length': 1,
        },
      }), '/', 'cache-name');

      expect(channel.postMessage.callCount).to.equal(1);
    });

    it('should not broadcast update if responses are the same', function() {
      const channelName = 'channel-name';
      const bcu = new BroadcastCacheUpdate(channelName);
      const channel = bcu._getChannel();
      sandbox.spy(channel, 'postMessage');

      bcu.notifyIfUpdated(new Response('', {
        headers: {
          'content-length': 0,
        },
      }), new Response('', {
        headers: {
          'content-length': 0,
        },
      }), '/', 'cache-name');

      expect(channel.postMessage.callCount).to.equal(0);
    });
  });
});

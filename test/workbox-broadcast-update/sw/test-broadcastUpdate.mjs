/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {
  CACHE_UPDATED_MESSAGE_TYPE,
  CACHE_UPDATED_MESSAGE_META,
} from 'workbox-broadcast-update/utils/constants.mjs';
import {broadcastUpdate} from 'workbox-broadcast-update/broadcastUpdate.mjs';


describe(`broadcastUpdate`, function() {
  const sandbox = sinon.createSandbox();
  const cacheName = 'test-cache';
  const url = 'https://example.com';

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  it(`should trigger the appropriate message event on a BroadcastChannel with the same channel name`, async function() {
    if (!('BroadcastChannel' in self)) this.skip();

    const channel = new BroadcastChannel('channel-name');
    sandbox.spy(channel, 'postMessage');

    await broadcastUpdate({channel, cacheName, url});

    expect(channel.postMessage.callCount).to.equal(1);
    expect(channel.postMessage.args[0][0]).to.deep.equal({
      type: CACHE_UPDATED_MESSAGE_TYPE,
      meta: CACHE_UPDATED_MESSAGE_META,
      payload: {
        cacheName,
        updatedURL: url,
      },
    });
  });

  it(`should fall back to using postMessage on each window client`, async function() {
    const OriginalBroadcastChannel = self.BroadcastChannel;
    delete self.BroadcastChannel;

    const pm1Spy = sandbox.spy();
    const pm2Spy = sandbox.spy();
    sandbox.stub(self.clients, 'matchAll')
        .withArgs(sinon.match.has('type', 'window'))
        .resolves([{postMessage: pm1Spy}, {postMessage: pm2Spy}]);

    await broadcastUpdate({channel: undefined, cacheName, url});

    const expectedData = {
      type: CACHE_UPDATED_MESSAGE_TYPE,
      meta: CACHE_UPDATED_MESSAGE_META,
      payload: {
        cacheName,
        updatedURL: url,
      },
    };

    expect(pm1Spy.callCount).to.equal(1);
    expect(pm1Spy.args[0][0]).to.deep.equal(expectedData);
    expect(pm2Spy.callCount).to.equal(1);
    expect(pm2Spy.args[0][0]).to.deep.equal(expectedData);

    if (OriginalBroadcastChannel) {
      self.BroadcastChannel = OriginalBroadcastChannel;
    }
  });
});

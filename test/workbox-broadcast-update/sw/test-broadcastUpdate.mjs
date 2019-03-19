/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';

import {CACHE_UPDATED_MESSAGE_TYPE, CACHE_UPDATED_MESSAGE_META}
  from '../../../packages/workbox-broadcast-update/utils/constants.mjs';
import {broadcastUpdate} from '../../../packages/workbox-broadcast-update/broadcastUpdate.mjs';

describe(`[workbox-broadcast-update] broadcastUpdate`, function() {
  const sandbox = sinon.createSandbox();
  const cacheName = 'test-cache';
  const url = 'https://example.com';

  it(`should trigger the appropriate message event on a BroadcastChannel with the same channel name`, function() {
    const channel = new BroadcastChannel('channel-name');
    sandbox.spy(channel, 'postMessage');

    broadcastUpdate({channel, cacheName, url});

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
});

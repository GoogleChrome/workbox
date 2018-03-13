/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import {expect} from 'chai';
import sinon from 'sinon';

import messageTypes from '../../../packages/workbox-broadcast-cache-update/messageTypes.mjs';
import {broadcastUpdate} from '../../../packages/workbox-broadcast-cache-update/broadcastUpdate.mjs';

describe(`[workbox-broadcast-cache-update] broadcastUpdate`, function() {
  const sandbox = sinon.sandbox.create();
  const cacheName = 'test-cache';
  const url = 'https://example.com';
  const source = 'test-source';

  it(`should trigger the appropriate message event on a BroadcastChannel with the same channel name`, function() {
    /** const secondChannel = new BroadcastChannel(channelName);
    secondChannel.addEventListener('message', (event) => {
      expect(event.data).to.deep.equal({

      });
      done();
    });**/
    const channel = new BroadcastChannel('channel-name');
    sandbox.spy(channel, 'postMessage');

    broadcastUpdate(channel, cacheName, url, source);

    expect(channel.postMessage.callCount).to.equal(1);
    expect(channel.postMessage.args[0][0]).to.deep.equal({
      type: messageTypes.CACHE_UPDATED,
      meta: source,
      payload: {
        cacheName,
        updatedUrl: url,
      },
    });
  });
});

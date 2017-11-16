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

import {assert} from 'workbox-core/_private/assert.mjs';
import MESSAGE_TYPES from './MESSAGE_TYPES.mjs';
import './_version.mjs';

/*
 * @param {Object} input
 * @param {BroadcastChannel} input.channel The `BroadcastChannel` to use.
 * @param {string} input.cacheName The name of the cache in which the updated
 *        `Response` was stored.
 * @param {string} input.url The URL associated with the updated `Response`.
 * @param {string} input.source A string identifying this library as the source
 *        of the update message.
 */
const broadcastUpdate = ({channel, cacheName, url, source} = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    assert.isInstance(channel, BroadcastChannel, {
      moduleName: 'workbox-broadcast-cache-update',
      className: '~',
      funcName: 'broadcaseUpdate',
      paramName: 'channel',
    });
    assert.isType(cacheName, 'string', {
      moduleName: 'workbox-broadcast-cache-update',
      className: '~',
      funcName: 'broadcaseUpdate',
      paramName: 'cacheName',
    });
    assert.isType(source, 'string', {
      moduleName: 'workbox-broadcast-cache-update',
      className: '~',
      funcName: 'broadcaseUpdate',
      paramName: 'source',
    });
    assert.isType(url, 'string', {
      moduleName: 'workbox-broadcast-cache-update',
      className: '~',
      funcName: 'broadcaseUpdate',
      paramName: 'url',
    });
  }

  channel.postMessage({
    type: MESSAGE_TYPES.CACHE_UPDATED,
    meta: source,
    payload: {
      cacheName: cacheName,
      updatedUrl: url,
    },
  });
};

export {broadcastUpdate};

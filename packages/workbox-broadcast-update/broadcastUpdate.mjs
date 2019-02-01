/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {CACHE_UPDATED_MESSAGE_TYPE, CACHE_UPDATED_MESSAGE_META}
  from './utils/constants.mjs';

import './_version.mjs';

/**
 * You would not normally call this method directly; it's called automatically
 * by an instance of the {@link BroadcastCacheUpdate} class. It's exposed here
 * for the benefit of developers who would rather not use the full
 * `BroadcastCacheUpdate` implementation.
 *
 * Calling this will dispatch a message on the provided
 * {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel}
 * to notify interested subscribers about a change to a cached resource.
 *
 * The message that's posted has a formation inspired by the
 * [Flux standard action](https://github.com/acdlite/flux-standard-action#introduction)
 * format like so:
 *
 * ```
 * {
 *   type: 'CACHE_UPDATED',
 *   meta: 'workbox-broadcast-update',
 *   payload: {
 *     cacheName: 'the-cache-name',
 *     updatedURL: 'https://example.com/'
 *   }
 * }
 * ```
 *
 * (Usage of [Flux](https://facebook.github.io/flux/) itself is not at
 * all required.)
 *
 * @param {Object} options
 * @param {string} options.cacheName The name of the cache in which the updated
 *     `Response` was stored.
 * @param {string} options.url The URL associated with the updated `Response`.
 * @param {BroadcastChannel} [options.channel] The `BroadcastChannel` to use.
 *     If no channel is set or the browser doesn't support the BroadcastChannel
 *     api, then an attempt will be made to `postMessage` each window client.
 *
 * @memberof workbox.broadcastUpdate
 */
const broadcastUpdate = async ({channel, cacheName, url}) => {
  if (process.env.NODE_ENV !== 'production') {
    assert.isType(cacheName, 'string', {
      moduleName: 'workbox-broadcast-update',
      className: '~',
      funcName: 'broadcastUpdate',
      paramName: 'cacheName',
    });
    assert.isType(url, 'string', {
      moduleName: 'workbox-broadcast-update',
      className: '~',
      funcName: 'broadcastUpdate',
      paramName: 'url',
    });
  }

  const data = {
    type: CACHE_UPDATED_MESSAGE_TYPE,
    meta: CACHE_UPDATED_MESSAGE_META,
    payload: {
      cacheName: cacheName,
      updatedURL: url,
    },
  };

  if (channel) {
    channel.postMessage(data);
  } else {
    const windows = await clients.matchAll({type: 'window'});
    for (const win of windows) {
      win.postMessage(data);
    }
  }
};

export {broadcastUpdate};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.js';
import {CacheDidUpdateCallbackParam} from 'workbox-core/types.js';
import {logger} from 'workbox-core/_private/logger.js';
import {responsesAreSame} from './responsesAreSame.js';
import {CACHE_UPDATED_MESSAGE_TYPE, CACHE_UPDATED_MESSAGE_META, DEFAULT_HEADERS_TO_CHECK} from './utils/constants.js';

import './_version.js';


// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

export interface BroadcastCacheUpdateOptions {
  headersToCheck?: string[];
  generatePayload?: (options: CacheDidUpdateCallbackParam) => Object;
}

/**
 * Generates the default payload used in update messages. By default the
 * payload includes the `cacheName` and `updatedURL` fields.
 *
 * @return Object
 * @private
 */
function defaultPayloadGenerator(data: CacheDidUpdateCallbackParam): Object {
  return {
    cacheName: data.cacheName,
    updatedURL: data.request.url,
  };
}

/**
 * Uses the `postMessage()` API to inform any open windows/tabs when a cached
 * response has been updated.
 *
 * For efficiency's sake, the underlying response bodies are not compared;
 * only specific response headers are checked.
 *
 * @memberof workbox.broadcastUpdate
 */
class BroadcastCacheUpdate {
  private _headersToCheck: string[];
  private _generatePayload: (options: CacheDidUpdateCallbackParam) => Object;

  /**
   * Construct a BroadcastCacheUpdate instance with a specific `channelName` to
   * broadcast messages on
   *
   * @param {Object} options
   * @param {Array<string>} [options.headersToCheck=['content-length', 'etag', 'last-modified']]
   *     A list of headers that will be used to determine whether the responses
   *     differ.
   * @param {string} [options.generatePayload] A function whose return value
   *     will be used as the `payload` field in any cache update messages sent
   *     to the window clients.
   */
  constructor({
    headersToCheck,
    generatePayload,
  }: BroadcastCacheUpdateOptions = {}) {
    this._headersToCheck = headersToCheck || DEFAULT_HEADERS_TO_CHECK;
    this._generatePayload = generatePayload || defaultPayloadGenerator;
  }

  /**
   * Compares two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
   * and sends a message (via `postMessage()`) to all window clients if the
   * responses differ (note: neither of the Responses can be
   * {@link http://stackoverflow.com/questions/39109789|opaque}).
   *
   * The message that's posted has the following format (where `payload` can
   * be customized via the `generatePayload` option the instance is created
   * with):
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
   * @param {Object} options
   * @param {Response} [options.oldResponse] Cached response to compare.
   * @param {Response} options.newResponse Possibly updated response to compare.
   * @param {Request} options.request The request.
   * @param {string} options.cacheName Name of the cache the responses belong
   *     to. This is included in the broadcast message.
   * @param {Event} [options.event] event An optional event that triggered
   *     this possible cache update.
   * @return {Promise} Resolves once the update is sent.
   */
  async notifyIfUpdated(options: CacheDidUpdateCallbackParam): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      assert!.isType(options.cacheName, 'string', {
        moduleName: 'workbox-broadcast-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'notifyIfUpdated',
        paramName: 'cacheName',
      });
      assert!.isInstance(options.newResponse, Response, {
        moduleName: 'workbox-broadcast-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'notifyIfUpdated',
        paramName: 'newResponse',
      });
      assert!.isInstance(options.request, Request, {
        moduleName: 'workbox-broadcast-update',
        className: 'BroadcastCacheUpdate',
        funcName: 'notifyIfUpdated',
        paramName: 'request',
      });
    }

    // Without two responses there is nothing to compare.
    if (!options.oldResponse) {
      return;
    }

    if (!responsesAreSame(options.oldResponse!, options.newResponse, this._headersToCheck)) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log(
            `Newer response found (and cached) for:`, options.request.url);
      }

      const messageData = {
        type: CACHE_UPDATED_MESSAGE_TYPE,
        meta: CACHE_UPDATED_MESSAGE_META,
        payload: this._generatePayload(options),
      };

      const windows = await self.clients.matchAll({type: 'window'});
      for (const win of windows) {
        win.postMessage(messageData);
      }
    }
  }
}

export {BroadcastCacheUpdate};

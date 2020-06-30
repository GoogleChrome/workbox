/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxPlugin} from 'workbox-core/types.js';
import {Strategy} from 'workbox-strategies/Strategy.js';
import {StrategyHandler} from 'workbox-strategies/StrategyHandler.js';
import '../_version.js';


interface MatchWrapperOptions {
  cacheName: string;
  request: Request;
  event: ExtendableEvent;
  plugins?: WorkboxPlugin[];
  matchOptions?: CacheQueryOptions;
}

interface PutWrapperOptions extends MatchWrapperOptions {
  response: Response;
}

class CacheStrategy extends Strategy {
  async _handle(request: Request, handler: StrategyHandler) {
    // Will not be called, but needed to make TypeScript happy...
    return handler.fetch(request);
  }
}

/**
 * This is a wrapper around cache.match().
 *
 * @param {Object} options
 * @param {string} options.cacheName Name of the cache to match against.
 * @param {Request} options.request The Request that will be used to look up
 *     cache entries.
 * @param {Event} [options.event] The event that prompted the action.
 * @param {Object} [options.matchOptions] Options passed to cache.match().
 * @param {Array<Object>} [options.plugins=[]] Array of plugins.
 * @return {Response} A cached response if available.
 *
 * @private
 * @memberof module:workbox-core
 */
const match = async ({
  cacheName,
  request,
  event,
  matchOptions,
  plugins = [],
}: MatchWrapperOptions): Promise<Response|undefined> => {
  if (typeof request === 'string') {
    request = new Request(request);
  }

  const strategy = new CacheStrategy({cacheName, plugins, matchOptions});
  const handler = new StrategyHandler(strategy, {request, event});

  try {
    return await handler.cacheMatch(request);
  } finally {
    // Destroy the handler, even in the case of an error.
    handler.destroy();
  }
};

/**
 * Wrapper around cache.put().
 *
 * Will call `cacheDidUpdate` on plugins if the cache was updated, using
 * `matchOptions` when determining what the old entry is.
 *
 * @param {Object} options
 * @param {string} options.cacheName
 * @param {Request} options.request
 * @param {Response} options.response
 * @param {Event} [options.event]
 * @param {Array<Object>} [options.plugins=[]]
 * @param {Object} [options.matchOptions]
 *
 * @private
 * @memberof module:workbox-core
 */
const put = async ({
  cacheName,
  request,
  response,
  event,
  plugins = [],
  matchOptions,
}: PutWrapperOptions): Promise<void> => {
  if (typeof request === 'string') {
    request = new Request(request);
  }

  const strategy = new CacheStrategy({cacheName, plugins, matchOptions});
  const handler = new StrategyHandler(strategy, {request, event});

  try {
    await handler.cachePut(request, response);
  } finally {
    // Destroy the handler, even in the case of an error.
    handler.destroy();
  }
};

export const cacheWrapper = {put, match};

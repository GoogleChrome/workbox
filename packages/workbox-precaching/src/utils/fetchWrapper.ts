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


interface WrappedFetchOptions {
  request: Request | string;
  event: ExtendableEvent;
  plugins?: WorkboxPlugin[];
  fetchOptions?: RequestInit;
}

class FetchStrategy extends Strategy {
  async _handle(request: Request, handler: StrategyHandler) {
    // Will not be called, but needed to make TypeScript happy...
    return handler.fetch(request);
  }
}

/**
 * Wrapper around the fetch API.
 *
 * Will call requestWillFetch on available plugins.
 *
 * @param {Object} options
 * @param {Request|string} options.request
 * @param {Object} [options.fetchOptions]
 * @param {ExtendableEvent} [options.event]
 * @param {Array<Object>} [options.plugins=[]]
 * @return {Promise<Response>}
 *
 * @private
 * @memberof module:workbox-core
 */
const fetch = async ({
  request,
  fetchOptions,
  event,
  plugins = [],
}: WrappedFetchOptions): Promise<Response> => {
  if (typeof request === 'string') {
    request = new Request(request);
  }

  const strategy = new FetchStrategy({plugins, fetchOptions});
  const handler = new StrategyHandler(strategy, {request, event});

  try {
    return await handler.fetch(request);
  } finally {
    // Destroy the handler, even in the case of an error.
    handler.destroy();
  }
};

export const fetchWrapper = {fetch};

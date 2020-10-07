/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.js';
import {logger} from 'workbox-core/_private/logger.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';

import {Strategy} from './Strategy.js';
import {StrategyHandler} from './StrategyHandler.js';
import {messages} from './utils/messages.js';
import './_version.js';


/**
 * An implementation of a
 * [cache-only]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only}
 * request strategy.
 *
 * This class is useful if you want to take advantage of any
 * [Workbox plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}.
 *
 * If there is no cache match, this will throw a `WorkboxError` exception.
 *
 * @extends module:workbox-strategies.Strategy
 * @memberof module:workbox-strategies
 */
class CacheOnly extends Strategy {
  /**
   * @private
   * @param {Request|string} request A request to run this strategy for.
   * @param {module:workbox-strategies.StrategyHandler} handler The event that
   *     triggered the request.
   * @return {Promise<Response>}
   */
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    if (process.env.NODE_ENV !== 'production') {
      assert!.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: this.constructor.name,
        funcName: 'makeRequest',
        paramName: 'request',
      });
    }

    const response = await handler.cacheMatch(request);

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
          messages.strategyStart(this.constructor.name, request));
      if (response) {
        logger.log(`Found a cached response in the '${this.cacheName}' ` +
          `cache.`);
        messages.printFinalResponse(response);
      } else {
        logger.log(`No response found in the '${this.cacheName}' cache.`);
      }
      logger.groupEnd();
    }

    if (!response) {
      throw new WorkboxError('no-response', {url: request.url});
    }
    return response;
  }
}

export {CacheOnly};

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
 * [network-only]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only}
 * request strategy.
 *
 * This class is useful if you want to take advantage of any
 * [Workbox plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}.
 *
 * If the network request fails, this will throw a `WorkboxError` exception.
 *
 * @extends module:workbox-core.Strategy
 * @memberof module:workbox-strategies
 */
class NetworkOnly extends Strategy {
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
        className: 'NetworkOnly',
        funcName: 'handle',
        paramName: 'request',
      });
    }

    let error;
    let response;
    try {
      response = await handler.fetch(request);
    } catch (err) {
      error = err;
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
          messages.strategyStart('NetworkOnly', request));
      if (response) {
        logger.log(`Got response from network.`);
      } else {
        logger.log(`Unable to get a response from the network.`);
      }
      messages.printFinalResponse(response);
      logger.groupEnd();
    }

    if (!response) {
      throw new WorkboxError('no-response', {url: request.url, error});
    }
    return response;
  }
}

export {NetworkOnly};

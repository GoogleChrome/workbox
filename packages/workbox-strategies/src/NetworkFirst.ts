/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.js';
import {logger} from 'workbox-core/_private/logger.js';
import {WorkboxError} from 'workbox-core/_private/WorkboxError.js';

import {cacheOkAndOpaquePlugin} from './plugins/cacheOkAndOpaquePlugin.js';
import {Strategy, StrategyOptions} from './Strategy.js';
import {StrategyHandler} from './StrategyHandler.js';
import {messages} from './utils/messages.js';
import './_version.js';


export interface NetworkFirstOptions extends StrategyOptions {
  networkTimeoutSeconds?: number;
}

/**
 * An implementation of a
 * [network first]{@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache}
 * request strategy.
 *
 * By default, this strategy will cache responses with a 200 status code as
 * well as [opaque responses]{@link https://developers.google.com/web/tools/workbox/guides/handle-third-party-requests}.
 * Opaque responses are are cross-origin requests where the response doesn't
 * support [CORS]{@link https://enable-cors.org/}.
 *
 * If the network request fails, and there is no cache match, this will throw
 * a `WorkboxError` exception.
 *
 * @extends module:workbox-strategies.Strategy
 * @memberof module:workbox-strategies
 */
class NetworkFirst extends Strategy {
  private readonly _networkTimeoutSeconds: number;

  /**
   * @param {Object} [options]
   * @param {string} [options.cacheName] Cache name to store and retrieve
   * requests. Defaults to cache names provided by
   * [workbox-core]{@link module:workbox-core.cacheNames}.
   * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
   * to use in conjunction with this caching strategy.
   * @param {Object} [options.fetchOptions] Values passed along to the
   * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
   * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
   * `fetch()` requests made by this strategy.
   * @param {Object} [options.matchOptions] [`CacheQueryOptions`](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions)
   * @param {number} [options.networkTimeoutSeconds] If set, any network requests
   * that fail to respond within the timeout will fallback to the cache.
   *
   * This option can be used to combat
   * "[lie-fi]{@link https://developers.google.com/web/fundamentals/performance/poor-connectivity/#lie-fi}"
   * scenarios.
   */
  constructor(options: NetworkFirstOptions = {}) {
    super(options);

    // If this instance contains no plugins with a 'cacheWillUpdate' callback,
    // prepend the `cacheOkAndOpaquePlugin` plugin to the plugins list.
    if (!this.plugins.some((p) => 'cacheWillUpdate' in p)) {
      this.plugins.unshift(cacheOkAndOpaquePlugin);
    }

    this._networkTimeoutSeconds = options.networkTimeoutSeconds || 0;
    if (process.env.NODE_ENV !== 'production') {
      if (this._networkTimeoutSeconds) {
        assert!.isType(this._networkTimeoutSeconds, 'number', {
          moduleName: 'workbox-strategies',
          className: this.constructor.name,
          funcName: 'constructor',
          paramName: 'networkTimeoutSeconds',
        });
      }
    }
  }

  /**
   * @private
   * @param {Request|string} request A request to run this strategy for.
   * @param {module:workbox-strategies.StrategyHandler} handler The event that
   *     triggered the request.
   * @return {Promise<Response>}
   */
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    const logs: any[] = [];

    if (process.env.NODE_ENV !== 'production') {
      assert!.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: this.constructor.name,
        funcName: 'handle',
        paramName: 'makeRequest',
      });
    }

    const promises: Promise<Response | undefined>[] = [];
    let timeoutId: number | undefined;

    if (this._networkTimeoutSeconds) {
      const {id, promise} = this._getTimeoutPromise({request, logs, handler});
      timeoutId = id;
      promises.push(promise);
    }

    const networkPromise =
        this._getNetworkPromise({timeoutId, request, logs, handler});

    promises.push(networkPromise);

    const response = await handler.waitUntil((async () => {
      // Promise.race() will resolve as soon as the first promise resolves.
      return await handler.waitUntil(Promise.race(promises)) ||
          // If Promise.race() resolved with null, it might be due to a network
          // timeout + a cache miss. If that were to happen, we'd rather wait until
          // the networkPromise resolves instead of returning null.
          // Note that it's fine to await an already-resolved promise, so we don't
          // have to check to see if it's still "in flight".
          await networkPromise;
    })());

    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
          messages.strategyStart(this.constructor.name, request));
      for (const log of logs) {
        logger.log(log);
      }
      messages.printFinalResponse(response);
      logger.groupEnd();
    }

    if (!response) {
      throw new WorkboxError('no-response', {url: request.url});
    }
    return response;
  }

  /**
   * @param {Object} options
   * @param {Request} options.request
   * @param {Array} options.logs A reference to the logs array
   * @param {Event} options.event
   * @return {Promise<Response>}
   *
   * @private
   */
  private _getTimeoutPromise({request, logs, handler}: {
    request: Request;
    logs: any[];
    handler: StrategyHandler;
  }): {promise: Promise<Response | undefined>; id?: number} {
    let timeoutId;
    const timeoutPromise: Promise<Response | undefined> = new Promise((resolve) => {
      const onNetworkTimeout = async () => {
        if (process.env.NODE_ENV !== 'production') {
          logs.push(`Timing out the network response at ` +
            `${this._networkTimeoutSeconds} seconds.`);
        }
        resolve(await handler.cacheMatch(request));
      };
      timeoutId = setTimeout(
          onNetworkTimeout,
          this._networkTimeoutSeconds * 1000,
      );
    });

    return {
      promise: timeoutPromise,
      id: timeoutId,
    };
  }

  /**
   * @param {Object} options
   * @param {number|undefined} options.timeoutId
   * @param {Request} options.request
   * @param {Array} options.logs A reference to the logs Array.
   * @param {Event} options.event
   * @return {Promise<Response>}
   *
   * @private
   */
  async _getNetworkPromise({timeoutId, request, logs, handler}: {
    request: Request;
    logs: any[];
    timeoutId?: number;
    handler: StrategyHandler;
  }): Promise<Response|undefined> {
    let error;
    let response;
    try {
      response = await handler.fetchAndCachePut(request);
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        error = fetchError;
      }
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (process.env.NODE_ENV !== 'production') {
      if (response) {
        logs.push(`Got response from network.`);
      } else {
        logs.push(`Unable to get a response from the network. Will respond ` +
          `with a cached response.`);
      }
    }

    if (error || !response) {
      response = await handler.cacheMatch(request);

      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          logs.push(`Found a cached response in the '${this.cacheName}'` +
            ` cache.`);
        } else {
          logs.push(`No response found in the '${this.cacheName}' cache.`);
        }
      }
    }

    return response;
  }
}

export {NetworkFirst};

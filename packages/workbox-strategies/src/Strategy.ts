/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.js';
import {MapLikeObject, RouteHandlerObject, RouteHandlerCallbackOptions, WorkboxPlugin} from 'workbox-core/types.js';
import {StrategyHandler} from './StrategyHandler.js';
import './_version.js';


export interface StrategyOptions {
  cacheName?: string;
  plugins?: WorkboxPlugin[];
  fetchOptions?: RequestInit;
  matchOptions?: CacheQueryOptions;
}

type StrategyHandlerOptions = {
  request: Request;
  event?: ExtendableEvent;
  response?: Response;
  params?: string[] | MapLikeObject;
}

/**
 * An abstract base class that all other strategy classes must extend from:
 *
 * @memberof module:workbox-strategies
 */
abstract class Strategy implements RouteHandlerObject {
  cacheName: string;
  plugins: WorkboxPlugin[];
  fetchOptions?: RequestInit;
  matchOptions?: CacheQueryOptions;

  protected abstract _handle(
    request: Request,
    handler: StrategyHandler
  ): Promise<Response>;

  /**
   * Creates a new instance of the strategy and sets all documented option
   * properties as public instance properties.
   *
   * Note: if a custom strategy class extends the base Strategy class and does
   * not need more than these properties, it does not need to define its own
   * constructor.
   *
   * @param {Object} options
   * @param {string} options.cacheName Cache name to store and retrieve
   * requests. Defaults to the cache names provided by
   * [workbox-core]{@link module:workbox-core.cacheNames}.
   * @param {Array<Object>} options.plugins [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
   * to use in conjunction with this caching strategy.
   * @param {Object} options.fetchOptions Values passed along to the
   * [`init`]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters}
   * of all fetch() requests made by this strategy.
   * @param {Object} options.matchOptions The
   * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
   * for any `cache.match()` or `cache.put()` calls made by this strategy.
   */
  constructor(options: StrategyOptions = {}) {
    /**
     * Cache name to store and retrieve
     * requests. Defaults to the cache names provided by
     * [workbox-core]{@link module:workbox-core.cacheNames}.
     *
     * @instance
     */
    this.cacheName = cacheNames.getRuntimeName(options.cacheName);
    /**
     * The list
     * [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
     * used by this strategy.
     *
     * @instance
     */
    this.plugins = options.plugins || [];
    /**
     * Values passed along to the
     * [`init`]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters}
     * of all fetch() requests made by this strategy.
     *
     * @instance
     */
    this.fetchOptions = options.fetchOptions;
    /**
     * The
     * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
     * for any `cache.match()` or `cache.put()` calls made by this strategy.
     *
     * @instance
     */
    this.matchOptions = options.matchOptions;
  }

  /**
   * Perform a request strategy and returns a `Promise` that will resolve with
   * a `Response`, invoking all relevant plugin callbacks.
   *
   * When a strategy instance is registered with a Workbox
   * [route]{@link module:workbox-routing.Route}, this method is automatically
   * called when the route matches.
   *
   * Alternatively, this method can be used in a standalone `FetchEvent`
   * listener by passing it to `event.respondWith()`.
   *
   * @param {Object} options
   * @param {Request|string} options.request A request to run this strategy for.
   * @param {ExtendableEvent} [options.event]
   * @param {URL} [options.url]
   * @param {*} [options.params]
   */
  handle(options: FetchEvent | RouteHandlerCallbackOptions): Promise<Response> {
    const [responseDone] = this.handleAll(options);
    return responseDone;
  }

  /**
   * Similar to [`handle()`]{@link module:workbox-strategies.Strategy~handle}, but
   * instead of just returning a `Promise` that resolves to a `Response` it
   * it will return an tuple of [response, done] promises, where the former
   * (`response`) is equivalent to what `handle()` returns, and the latter is a
   * Promise that will resolve once any promises that were added to
   * `event.waitUntil()` as part of performing the strategy have completed.
   *
   * You can await the `done` promise to ensure any extra work performed by
   * the strategy (usually caching responses) completes successfully.
   *
   * @param {Object} options
   * @param {Request|string} options.request A request to run this strategy for.
   * @param {ExtendableEvent} [options.event]
   * @param {URL} [options.url]
   * @param {*} [options.params]
   * @return {Array<Promise>} A tuple of [response, done]
   *     promises that can be used to determine when the response resolves as
   *     well as when the handler has completed all its work.
   */
  handleAll(options: FetchEvent | RouteHandlerCallbackOptions): [
    Promise<Response>,
    Promise<void>,
   ] {
    // Allow for flexible options to be passed.
    if (options instanceof FetchEvent) {
      options = {
        event: options,
        request: options.request,
      };
    } else if (typeof options.request === 'string') {
      // `options.request` can be a string, similar to what `fetch()` accepts.
      options.request = new Request(options.request);
    }

    const {event, request, params} = options as StrategyHandlerOptions;
    const handler = new StrategyHandler(this, {event, request, params});

    const responseDone = this._getResponse(handler, request, event);
    const handlerDone = this._awaitComplete(responseDone, handler, request, event);

    // Return an array of promises, suitable for use with Promise.all().
    return [responseDone, handlerDone];
  }

  async _getResponse(handler: StrategyHandler, request: Request, event?: ExtendableEvent) {
    await handler.runCallbacks('handlerWillStart', {event, request});
    let response = await this._handle(request, handler);

    for (const callback of handler.iterateCallbacks('handlerWillRespond')) {
      response = await callback({event, request, response});
    }
    return response;
  }

  async _awaitComplete(responseDone: Promise<Response>, handler: StrategyHandler, request: Request, event?: ExtendableEvent) {
    let response;
    let error;

    try {
      response = await responseDone;
    } catch (error) {
      // Ignore errors, as response errors should be caught via the `response`
      // promise above. The `done` promise will only throw for errors in
      // promises passed to `handler.waitUntil()`.
    }

    try {
      await handler.runCallbacks('handlerDidRespond', {
        event,
        request,
        response,
      });
      await handler.doneWaiting();
    } catch (waitUntilError) {
      error = waitUntilError;
    }

    await handler.runCallbacks('handlerDidComplete', {
      event,
      request,
      response,
      error,
    });
    handler.destroy();

    if (error) {
      throw error;
    }
  }
}

export {Strategy}

/**
 * Classes extending the `Strategy` based class should implement this method,
 * and leverage the [`handler`]{@link module:workbox-strategies.StrategyHandler}
 * arg to perform all fetching and cache logic, which will ensure all relevant
 * cache, cache options, fetch options and plugins are used (per the current
 * strategy instance).
 *
 * @name _handle
 * @instance
 * @abstract
 * @function
 * @param {Request} request
 * @param {module:workbox-strategies.StrategyHandler} handler
 * @return {Promise<Response>}
 *
 * @memberof module:workbox-strategies.Strategy
 */

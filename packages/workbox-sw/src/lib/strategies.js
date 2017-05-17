import {
  CacheFirst, CacheOnly, NetworkFirst,
  NetworkOnly, StaleWhileRevalidate,
} from '../../../workbox-runtime-caching/src/index.js';
import {CacheExpirationPlugin} from
  '../../../workbox-cache-expiration/src/index.js';
import {BroadcastCacheUpdatePlugin} from
  '../../../workbox-broadcast-cache-update/src/index.js';
import {CacheableResponsePlugin} from
  '../../../workbox-cacheable-response/src/index.js';
import {RequestWrapper} from '../../../workbox-runtime-caching/src/index.js';

/**
 * StrategyOptions is just a JavaScript object, but the structure
 * explains the options for runtime strategies used in workbox-sw.
 *
 * See the example of how this can be used with the `cacheFirst()` caching
 * strategy.
 *
 * @example
 * const workboxSW = new WorkboxSW();
 * const cacheFirstStrategy = workboxSW.strategies.cacheFirst({
 *   cacheName: 'example-cache',
 *   cacheExpiration: {
 *     maxEntries: 10,
 *     maxAgeSeconds: 7 * 24 * 60 * 60
 *   },
 *   broadcastCacheUpdate: {
 *     channelName: 'example-channel-name'
 *   },
 *   cacheableResponse: {
 *     statuses: [0, 200, 404],
 *     headers: {
 *       'Example-Header-1': 'Header-Value-1',
 *       'Example-Header-2': 'Header-Value-2'
 *     }
 *   }
 *   plugins: [
 *     // Additional Plugins
 *   ]
 * });
 *
 * @typedef {Object} StrategyOptions
 * @property {String} cacheName Name of cache to use
 * for caching (both lookup and updating).
 * @property {Object} cacheExpiration Defining this
 * object will add a cache expiration plugins to this strategy.
 * @property {Number} cacheExpiration.maxEntries
 * The maximum number of entries to store in a cache.
 * @property {Number} cacheExpiration.maxAgeSeconds
 * The maximum lifetime of a request to stay in the cache before it's removed.
 * @property {Object} broadcastCacheUpdate Defining
 * this object will add a broadcast cache update plugin.
 * @property {String} broadcastCacheUpdate.channelName
 * The name of the broadcast channel to dispatch messages on.
 * @property {Array<plugins>} plugins For
 * any additional plugins you wish to add, simply include them in this
 * array.
 * @property {Object} cacheableResponse Specifies types of responses to cache
 * by status codes, headers, or both.
 * @property {Array<Number>} cacheableResponse.statuses An array of status
 * codes to cache.
 * @property {Array<Object>} cacheableResponse.headers An array of
 * header-value pairs for HTTP headers to cache. See the example, above.
 * @memberof module:workbox-sw.Strategies
 */

/**
 * This is a simple class used to namespace the supported caching strategies in
 * workbox-sw.
 *
 * You would never access this class directly but instead use with
 * `workboxSW.strategies.<Strategy Name>`.
 *
 * @memberof module:workbox-sw
 */
class Strategies {
  /**
   * This constructor will configure shared options across each strategy.
   * @param {String} [input.cacheId] The cacheId to be applied to the run
   * time strategies cache names.
   */
  constructor({cacheId} = {}) {
    this._cacheId = cacheId;
  }

  /**
   * A [cache first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)
   * run-time caching strategy.
   *
   * @example
   * const = new WorkboxSW();
   * const cacheFirstStrategy = workboxSW.strategies.cacheFirst();
   *
   * workboxSW.router.registerRoute('/styles/*', cacheFirstStrategy);
   *
   * @param {module:workbox-sw.Strategies.StrategyOptions} [options] To
   * define any additional caching or broadcast plugins pass in option values.
   * @return {module:workbox-runtime-caching.CacheFirst} An instance of a
   * `CacheFirst` handler.
   */
  cacheFirst(options) {
    return this._getCachingMechanism(CacheFirst, options);
  }

  /**
   * A [cache only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only)
   * run-time caching strategy.
   *
   * @example
   * const workboxSW = new WorkboxSW();
   * const cacheOnlyStrategy = workboxSW.strategies.cacheOnly();
   *
   * workboxSW.router.registerRoute('/styles/*', cacheOnlyStrategy);
   *
   * @param {module:workbox-sw.Strategies.StrategyOptions} [options] To
   * define any additional caching or broadcast plugins pass in option values.
   * @return {module:workbox-runtime-caching.CacheOnly} An instance of a
   * `CacheOnly` handler.
   */
  cacheOnly(options) {
    return this._getCachingMechanism(CacheOnly, options);
  }

  /**
   * A [network first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache)
   * run-time caching strategy.
   *
   * @example
   * const workboxSW = new WorkboxSW();
   * const networkFirstStrategy = workboxSW.strategies.networkFirst();
   *
   * workboxSW.router.registerRoute('/blog/', networkFirstStrategy);
   *
   * @param {module:workbox-sw.Strategies.StrategyOptions} [options] To
   * define any additional caching or broadcast plugins pass in option values.
   * @return {module:workbox-runtime-caching.NetworkFirst} An instance of a
   * `NetworkFirst` handler.
   */
  networkFirst(options) {
    return this._getCachingMechanism(NetworkFirst, options);
  }

  /**
   * A [network only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only)
   * run-time caching strategy.
   *
   * @example
   * const workboxSW = new WorkboxSW();
   * const networkOnlyStrategy = workboxSW.strategies.networkOnly();
   *
   * workboxSW.router.registerRoute('/admin/', networkOnlyStrategy);
   *
   * @param {module:workbox-sw.Strategies.StrategyOptions} [options] To
   * define any additional caching or broadcast plugins pass in option values.
   * @return {module:workbox-runtime-caching.NetworkOnly} An instance of a
   * `NetworkOnly` handler.
   */
  networkOnly(options) {
    return this._getCachingMechanism(NetworkOnly, options);
  }

  /**
   * A [stale while revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate)
   * run-time caching strategy.
   *
   * @example
   * const workboxSW = new WorkboxSW();
   * const staleWhileRevalidateStrategy =
   *  workboxSW.strategies.staleWhileRevalidate();
   *
   * workboxSW.router.registerRoute('/styles/*', staleWhileRevalidateStrategy);
   *
   * @param {module:workbox-sw.Strategies.StrategyOptions} [options] To
   * define any additional caching or broadcast plugins pass in option values.
   * @return {module:workbox-runtime-caching.StaleWhileRevalidate}
   *  An instance of a `StaleWhileRevalidate` handler.
   */
  staleWhileRevalidate(options) {
    return this._getCachingMechanism(StaleWhileRevalidate, options);
  }

  /**
   * This method will add plugins based on options passed in by the
   * developer.
   *
   * @private
   * @param {Class} HandlerClass The class to be configured and instantiated.
   * @param {Object} [options] Options to configure the handler.
   * @return {Handler} A handler instance configured with the appropriate
   * behaviours
   */
  _getCachingMechanism(HandlerClass, options = {}) {
    const pluginParamsToClass = {
      'cacheExpiration': CacheExpirationPlugin,
      'broadcastCacheUpdate': BroadcastCacheUpdatePlugin,
      'cacheableResponse': CacheableResponsePlugin,
    };

    const wrapperOptions = {
      plugins: [],
      cacheId: this._cacheId,
    };

    if (options['cacheName']) {
      wrapperOptions['cacheName'] = options['cacheName'];
    }

    // Iterate over known plugins and add them to Request Wrapper options.
    const pluginKeys = Object.keys(pluginParamsToClass);
    pluginKeys.forEach((pluginKey) => {
      if (options[pluginKey]) {
        const PluginClass = pluginParamsToClass[pluginKey];
        const pluginParams = options[pluginKey];

        wrapperOptions.plugins.push(new PluginClass(pluginParams));
      }
    });

    // Add custom plugins.
    if (options.plugins) {
      options.plugins.forEach((plugin) => {
        wrapperOptions.plugins.push(plugin);
      });
    }

    options.requestWrapper = new RequestWrapper(wrapperOptions);
    // Pass through the initial options to the underlying Handler constructor
    // to allow for Handler-specific customization.
    return new HandlerClass(options);
  }
}

export default Strategies;

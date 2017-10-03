/**
 * Wrapper around cache.put().
 *
 * Will call `cacheDidUpdate` on plugins if the cache was updated.
 * @param {string} cacheName
 * @param {Request} request
 * @param {Response} response
 * @param {Array<Object>} [plugins]
 *
 * @private
 * @memberof module:workbox-core
 */
const putWrapper = async (cacheName, request, response, plugins = []) => {
  let responseToCache = await _isResponseSafeToCache(
    request, response, plugins);
  if (!responseToCache) {
    return;
  }

  const cache = await caches.open(cacheName);

  const updatePlugins = plugins.filter((plugin) => {
    return plugin.cacheDidUpdate;
  });
  let oldResponse = updatePlugins.length > 0 ?
    await matchWrapper(cacheName, request) : null;

  // Regardless of whether or not we'll end up invoking
  // cacheDidUpdate, wait until the cache is updated.
  await cache.put(request, responseToCache);

  for (let plugin of updatePlugins) {
    await plugin.cacheDidUpdate({
      cacheName,
      request,
      oldResponse,
      newResponse: responseToCache,
    });
  }
};

/**
 * This is a wrapper around cache.match().
 *
 * @param {string} cacheName Name of the cache to match against.
 * @param {Request} request The Request that will be used to look up cache
 * entries.
 * @param {Object} matchOptions Options passed to cache.match().
 * @param {Array<Object>} [plugins] Array of plugins.
 * @return {Response} A cached response if available.
 *
 * @private
 * @memberof module:workbox-core
 */
const matchWrapper = async (cacheName, request, matchOptions, plugins = []) => {
  const cache = await caches.open(cacheName);
  let cachedResponse = await cache.match(request, matchOptions);
  // In the cache of cacheWrapper.put(), we aren't really "using"
  // a response, so calling these plugins makes no sense,
  // But further more, the "using" aspect should be managed
  // by the actual use case, not the cache wrapper
  /** for (let plugin of plugins) {
    if (plugin.cachedResponseWillBeUsed) {
      cachedResponse = await plugin.cachedResponseWillBeUsed({
        request,
        cache,
        cachedResponse,
        matchOptions,
        cacheName: CACHE_NAME,
      });
    }
  }**/
  return cachedResponse;
};

/**
 * This method will call cacheWillUpdate on the available plugins (or use
 * response.ok) to determine if the Response is safe and valid to cache.
 * @param {Request} request
 * @param {Response} response
 * @param {Array<Object>} plugins
 * @return {Promise<Response>}
 *
 * @private
 * @memberof module:workbox-core
 */
const _isResponseSafeToCache = async (request, response, plugins) => {
  let responseToCache = response;
  let pluginsUsed = false;
  for (let plugin of plugins) {
    if (plugin.cacheWillUpdate) {
      pluginsUsed = true;
      responseToCache = await plugin.cacheWillUpdate({
        request,
        response: responseToCache,
      });
    }
  }

  if (!pluginsUsed) {
    responseToCache = responseToCache.ok ? responseToCache : null;
  }

  return responseToCache;
};

export default {
  put: putWrapper,
};

const putWrapper = async (request, response, plugins) => {
  if (!plugins) {
    plugins = [];
  }

  let responseToCache = await _isResponseSafeToCache(
    request, response, plugins);
  if (!responseToCache) {
    return;
  }

  const CACHE_NAME = 'TODO-CHANGE-ME';
  const cache = await caches.open(CACHE_NAME);

  let matchOptions;
  let oldResponse = await matchWrapper(request, matchOptions);

  // Regardless of whether or not we'll end up invoking
  // cacheDidUpdate, wait until the cache is updated.
  await cache.put(request, responseToCache);

  for (let plugin of plugins) {
    if (plugin.cacheDidUpdate) {
      await plugin.cacheDidUpdate(CACHE_NAME,
        request,
        oldResponse,
        responseToCache,
      );
    }
  }

  /**

  // Only conditionally await the caching completion, giving developers the
  // option of returning early for, e.g., read-through-caching scenarios.
  if (waitOnCache) {
    await cachePutPromise;
  }**/
};

const matchWrapper = async (request, matchOptions, plugins) => {
  const CACHE_NAME = 'TODO-CHANGE-ME';

  const cache = await caches.open(CACHE_NAME);
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

const _isResponseSafeToCache = async (request, response, plugins) => {
  let responseToCache = response;
  let pluginsUsed = false;
  for (let plugin of plugins) {
    if (plugin.cacheWillUpdate) {
      pluginsUsed = true;
      responseToCache = await plugin.cacheWillUpdate(request, responseToCache);
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

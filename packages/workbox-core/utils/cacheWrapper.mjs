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
    if (plugin.cacheDidUpdate) {
      await plugin.cacheDidUpdate(cacheName,
        request,
        oldResponse,
        responseToCache,
      );
    }
  }
};

const matchWrapper = async (cacheName, request, matchOptions, plugins) => {
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

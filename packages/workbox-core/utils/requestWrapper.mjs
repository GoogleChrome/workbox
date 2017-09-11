const fetchAndCache = async({
  request, waitOnCache, cacheKey, cacheResponsePlugin, cleanRedirects}) => {
    const response = await this.fetch({request});
    const responseIsCachable = _canCacheResponse(request, response);

    if(!responseIsCachable && waitOnCache) {
      throw new Error('TODO: WorkboxError. Not cachable but told to wait');
    }

    if (responseIsCachable) {
      let cachePutPromise = _cacheResponse(request, response);

      // Only conditionally await the caching completion, giving developers the
      // option of returning early for, e.g., read-through-caching scenarios.
      if (waitOnCache) {
        await cachePutPromise;
      }
    }

    return response;
  }
};

const _canCacheResponse = (request, response) => {
  let cacheable = response.ok;

  // TODO Override with plugins if defined
    // TODO: Get global plugin from core and use that
    // TODO: Allow overriding of plugin by using input plugins.

  return cacheable;
};

const _cacheResponse = (request, response) => {
  // If cleanRedirects is set and this is a redirected response, then
  // get a "clean" copy to add to the cache.
  const newResponse = cleanRedirects && response.redirected ?
    await cleanResponseCopy({response}) :
    response.clone();

  // cachePutPromise is a promise that may or may not be used to delay the
  // completion of this method, depending on the value of `waitOnCache`.
  let cachePutPromise = this.getCache().then(async (cache) => {
    let oldResponse;
    const cacheRequest = cacheKey || request;

    // Only bother getting the old response if the new response isn't opaque
    // and there's at least one cacheDidUpdate plugin. Otherwise, we don't
    // need it.
    if (response.type !== 'opaque' &&
      this.plugins.has('cacheDidUpdate')) {
      oldResponse = await this.match({request: cacheRequest});
    }

    // Regardless of whether or not we'll end up invoking
    // cacheDidUpdate, wait until the cache is updated.
    await cache.put(cacheRequest, newResponse);

    if (this.plugins.has('cacheDidUpdate')) {
      for (let plugin of this.plugins.get('cacheDidUpdate')) {
        await plugin.cacheDidUpdate({
          cacheName: this.cacheName,
          oldResponse,
          newResponse,
          // cacheRequest may be a Request with a url property, or a string.
          url: ('url' in cacheRequest) ? cacheRequest.url : cacheRequest,
        });
      }
    }
  });
};

export {
  fetchAndCache,
};

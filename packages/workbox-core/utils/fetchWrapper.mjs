import WorkboxError from '../models/WorkboxError.mjs';

/**
 * Wrapper around the fetch API.
 *
 * Will call requestWillFetch on available plugins.
 *
 * @param {Request|string} request
 * @param {Object} fetchOptions
 * @param {Array<Object>} [plugins]
 * @return {Promise<Response>}
 *
 * @private
 * @memberof module:workbox-core
 */
const wrappedFetch = async (request, fetchOptions, plugins = []) => {
  if (typeof request === 'string') {
    request = new Request(request);
  }

  // TODO Move to assertion
  // assert.isInstance({request}, Request);

  const failedFetchPlugins = plugins.filter((plugin) => {
    return plugin.fetchDidFail;
  });

  // If there is a fetchDidFail plugin, we need to save a clone of the
  // original request before it's either modified by a requestWillFetch
  // plugin or before the original request's body is consumed via fetch().
  const originalRequest = failedFetchPlugins.length > 0 ?
    request.clone() : null;

  try {
    for (let plugin of plugins) {
      if (plugin.requestWillFetch) {
        request = await plugin.requestWillFetch({
          request: request.clone(),
        });

        // TODO Move to assertion
        // isInstance({request}, Request);
      }
    }
  } catch (err) {
    throw new WorkboxError('plugin-error-request-will-fetch', {
      thrownError: err,
    });
  }

  // The request can be altered by plugins with `requestWillFetch` making
  // the original request (Most likely from a `fetch` event) to be different
  // to the Request we make. Pass both to `fetchDidFail` to aid debugging.
  const pluginFilteredRequest = request.clone();

  try {
    return await fetch(request, fetchOptions);
  } catch (err) {
    for (let plugin of failedFetchPlugins) {
      await plugin.fetchDidFail({
        originalRequest: originalRequest.clone(),
        request: pluginFilteredRequest.clone(),
      });
    }

    throw err;
  }
};

export default {
  fetch: wrappedFetch,
};

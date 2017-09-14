import WorkboxError from '../models/WorkboxError.mjs';

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
        request = await plugin.requestWillFetch(request.clone());

        // TODO Move to assertion
        // isInstance({request}, Request);
      }
    }
  } catch (err) {
    throw new WorkboxError('plugin-error-request-will-fetch', {
      thrownError: err,
    });
  }

  const pluginFilteredRequest = request.clone();

  try {
    return await fetch(request, fetchOptions);
  } catch (err) {
    for (let plugin of failedFetchPlugins) {
      if (plugin.fetchDidFail) {
        await plugin.fetchDidFail(
          originalRequest.clone(),
          pluginFilteredRequest.clone(),
        );
      }
    }

    throw err;
  }
};

export default {
  fetch: wrappedFetch,
};

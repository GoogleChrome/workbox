/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {logger} from './logger.mjs';
import {assert} from './assert.mjs';
import {getFriendlyURL} from '../_private/getFriendlyURL.mjs';
import pluginEvents from '../models/pluginEvents.mjs';
import pluginUtils from '../utils/pluginUtils.mjs';
import '../_version.mjs';

/**
 * Wrapper around cache.put().
 *
 * Will call `cacheDidUpdate` on plugins if the cache was updated.
 *
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
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`Response '${getFriendlyURL(request.url)}' will not be ` +
        `cached.`, responseToCache);
    }
    return;
  }

  const cache = await caches.open(cacheName);

  const updatePlugins = pluginUtils.filter(
    plugins, pluginEvents.CACHE_DID_UPDATE);

  let oldResponse = updatePlugins.length > 0 ?
    await matchWrapper(cacheName, request) : null;

  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`Updating the '${cacheName}' cache with a new Response for ` +
      `${getFriendlyURL(request.url)}.`);
  }

  // Regardless of whether or not we'll end up invoking
  // cacheDidUpdate, wait until the cache is updated.
  await cache.put(request, responseToCache);

  for (let plugin of updatePlugins) {
    await plugin[pluginEvents.CACHE_DID_UPDATE].call(plugin, {
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
  if (process.env.NODE_ENV !== 'production') {
    if (cachedResponse) {
      logger.debug(`Found a cached response in '${cacheName}'.`);
    } else {
      logger.debug(`No cached response found in '${cacheName}'.`);
    }
  }
  for (let plugin of plugins) {
    if (pluginEvents.CACHED_RESPONSE_WILL_BE_USED in plugin) {
      cachedResponse = await plugin[pluginEvents.CACHED_RESPONSE_WILL_BE_USED]
        .call(plugin, {
          cacheName,
          request,
          matchOptions,
          cachedResponse,
        });
      if (process.env.NODE_ENV !== 'production') {
        if (cachedResponse) {
          assert.isInstance(cachedResponse, Response, {
            moduleName: 'Plugin',
            funcName: pluginEvents.CACHED_RESPONSE_WILL_BE_USED,
            isReturnValueProblem: true,
          });
        }
      }
    }
  }
  return cachedResponse;
};

/**
 * This method will call cacheWillUpdate on the available plugins (or use
 * response.ok) to determine if the Response is safe and valid to cache.
 *
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
    if (pluginEvents.CACHE_WILL_UPDATE in plugin) {
      pluginsUsed = true;
      responseToCache = await plugin[pluginEvents.CACHE_WILL_UPDATE]
        .call(plugin, {
          request,
          response: responseToCache,
        });

      if (process.env.NODE_ENV !== 'production') {
        if (responseToCache) {
          assert.isInstance(responseToCache, Response, {
            moduleName: 'Plugin',
            funcName: pluginEvents.CACHE_WILL_UPDATE,
            isReturnValueProblem: true,
          });
        }
      }

      if (!responseToCache) {
        break;
      }
    }
  }

  if (!pluginsUsed) {
    if (process.env.NODE_ENV !== 'production') {
      if (!responseToCache.ok) {
        if (responseToCache.status === 0) {
          logger.warn(`The response for '${request.url}' is an opaque ` +
            `response. The caching strategy that you're using will not ` +
            `cache opaque responses by default.`);
        } else {
          logger.debug(`The response for '${request.url}' returned ` +
          `a status code of '${response.status}' and won't be cached as a ` +
          `result.`);
        }
      }
    }
    responseToCache = responseToCache.ok ? responseToCache : null;
  }

  return responseToCache ? responseToCache : null;
};

const exports = {
  put: putWrapper,
  match: matchWrapper,
};

export {exports as cacheWrapper};

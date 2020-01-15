/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import './_version.mjs';

/**
 * @typedef {Object} ManifestEntry
 * @property {String} url The URL to the asset in the manifest.
 * @property {String} [revision] The revision details for the file. This is a
 * hash generated by node based on the file contents.
 * @property {String} [integrity] Integrity metadata that will be used when
 * making the network request for the URL.
 *
 * @memberof module:workbox-build
 */

/**
 * @typedef {Object} ManifestTransformResult
 * @property {Array<ManifestEntry>} manifest
 * @property {Array<string>|undefined} warnings
 *
 * @memberof module:workbox-build
 */

/**
 * @typedef {Object} RuntimeCachingEntry
 *
 * @property {string|module:workbox-routing~handlerCallback} handler
 * Either the name of one of the [built-in strategy classes](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies),
 * or custom handler callback to use when the generated route matches.
 *
 * @property {string|RegExp|module:workbox-routing~matchCallback} urlPattern
 * The value that will be passed to [`registerRoute()`]{@link module:workbox-routing.registerRoute},
 * used to determine whether the generated route will match a given request.
 *
 * @property {string} [method='GET'] The
 * [HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that
 * will match the generated route.
 *
 * @property {Object} [options]
 *
 * @property {Object} [options.backgroundSync]
 *
 * @property {string} [options.backgroundSync.name] The
 * [`name` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.backgroundSync.Queue.html)
 * to use when creating the `BackgroundSyncPlugin`.
 *
 * @property {Object} [options.backgroundSync.options] The
 * [`options` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.backgroundSync.Queue.html)
 * to use when creating the `BackgroundSyncPlugin`.
 *
 * @property {Object} [options.broadcastUpdate]
 *
 * @property {string} [options.broadcastUpdate.channelName]
 * The [`channelName` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.broadcastUpdate.BroadcastCacheUpdate)
 * to use when creating the `BroadcastCacheUpdatePlugin`.
 *
 * @property {Object} [options.broadcastUpdate.options] The
 * [`options` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.broadcastUpdate.BroadcastCacheUpdate)
 * to use when creating the `BroadcastCacheUpdatePlugin`.
 *
 * @property {Object} [options.cacheableResponse]
 *
 * @property {Object} [options.cacheableResponse.headers]
 * The [`headers` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.cacheableResponse.CacheableResponse)
 * to use when creating the `CacheableResponsePlugin`.
 *
 * @property {Array<number>} [options.cacheableResponse.statuses]
 * The [`status` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.cacheableResponse.CacheableResponse)
 * to use when creating the `CacheableResponsePlugin`.
 *
 * @property {string} [options.cacheName] The `cacheName`
 * to use when constructing one of the [Workbox strategy classes](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies).
 *
 * @property {Object} [options.fetchOptions]
 * The `fetchOptions` property value to use when creating the handler.
 *
 * @property {Object} [options.expiration]
 *
 * @property {number} [options.expiration.maxAgeSeconds]
 * The [`maxAgeSeconds` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.expiration.CacheExpiration)
 * to use when creating the `CacheExpirationPlugin`.
 *
 * @property {number} [options.expiration.maxEntries]
 * The [`maxAgeSeconds` property](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.expiration.CacheExpiration)
 * to use when creating the `CacheExpirationPlugin`.
 *
 * @property {Object} [options.matchOptions]
 * The `matchOptions` property value to use when creating the handler.
 *
 * @property {number} [options.networkTimeoutSeconds]
 * The `networkTimeoutSeconds` property value to use when creating a
 * `NetworkFirst` handler.
 *
 * @property {Array<Object>} [options.plugins]
 * One or more [additional plugins](https://developers.google.com/web/tools/workbox/guides/using-plugins#custom_plugins)
 * to apply to the handler. Useful when you want a plugin that doesn't have a
 * "shortcut" configuration, like `expiration` or `cacheableResponse`.
 *
 * @memberof module:workbox-build
 */

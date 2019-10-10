/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const upath = require('upath');

const generateSWSchema = require('./options/schema/generate-sw');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
const rebasePath = require('./lib/rebase-path');
const validate = require('./lib/validate-options');
const writeServiceWorkerUsingDefaultTemplate =
  require('./lib/write-sw-using-default-template');

/**
 * This method creates a list of URLs to precache, referred to as a "precache
 * manifest", based on the options you provide.
 *
 * It also takes in additional options that configures the service worker's
 * behavior, like any `runtimeCaching` rules it should use.
 *
 * Based on the precache manifest and the additional configuration, it writes
 * a ready-to-use service worker file to disk at `swDest`.
 *
 * @param {Object} config The configuration to use.
 * @param {string} config.swDest The path and filename of the service worker file
 * that will be created by the build process, relative to the current working
 * directory. It must end in '.js'.
 * @param {Array<ManifestEntry>} [config.additionalManifestEntries] A list of
 * entries to be precached, in addition to any entries that are generated as
 * part of the build configuration.
 * @param {RegExp} [config.dontCacheBustURLsMatching] Assets that match this will be
 * assumed to be uniquely versioned via their URL, and exempted from the normal
 * HTTP cache-busting that's done when populating the precache. While not
 * required, it's recommended that if your existing build process already
 * inserts a `[hash]` value into each filename, you provide a RegExp that will
 * detect that, as it will reduce the bandwidth consumed when precaching.
 * @param {Array<ManifestTransform>} [config.manifestTransforms] One or more
 * functions which will be applied sequentially against the generated manifest.
 * If `modifyURLPrefix` or `dontCacheBustURLsMatching` are also specified, their
 * corresponding transformations will be applied first.
 * @param {number} [config.maximumFileSizeToCacheInBytes=2097152] This value can be
 * used to determine the maximum size of files that will be precached. This
 * prevents you from inadvertently precaching very large files that might have
 * accidentally matched one of your patterns.
 * @param {string} [config.mode='production'] If set to 'production', then an
 * optimized service worker bundle that excludes debugging info will be
 * produced. If not explicitly configured here, the `process.env.NODE_ENV` value
 * will be used, and failing that, it will fall back to `'production'`.
 * @param {Object<string, string>} [config.modifyURLPrefix] A mapping of prefixes
 * that, if present in an entry in the precache manifest, will be replaced with
 * the corresponding value. This can be used to, for example, remove or add a
 * path prefix from a manifest entry if your web hosting setup doesn't match
 * your local filesystem setup. As an alternative with more flexibility, you can
 * use the `manifestTransforms` option and provide a function that modifies the
 * entries in the manifest using whatever logic you provide.
 * @param {Array<string>} [config.babelPresetEnvTargets=['chrome >= 56']]
 * The [targets](https://babeljs.io/docs/en/babel-preset-env#targets) to pass to
 * `babel-preset-env` when transpiling the service worker bundle.
 * @param {string} [config.cacheId] An optional ID to be prepended to cache
 * names. This is primarily useful for local development where multiple sites
 * may be served from the same `http://localhost:port` origin.
 * @param {boolean} [config.cleanupOutdatedCaches=false] Whether or not Workbox
 * should attempt to identify an delete any precaches created by older,
 * incompatible versions.
 * @param {boolean} [config.clientsClaim=false] Whether or not the service
 * worker should [start controlling](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim)
 * any existing clients as soon as it activates.
 * @param {string} [config.directoryIndex='index.html'] If a navigation request
 * for a URL ending in `/` fails to match a precached URL, this value will be
 * appended to the URL and that will be checked for a precache match. This
 * should be set to what your web server is using for its directory index.
 * @param {Array<RegExp>} [config.ignoreURLParametersMatching=[/^utm_/]]
 * Any search parameter names that match against one of the RegExp in this array
 * will be removed before looking for a precache match. This is useful if your
 * users might request URLs that contain, for example, URL parameters used to
 * track the source of the traffic.
 * @param {Array<string>} [config.importScripts] A list of JavaScript files that
 * should be passed to [`importScripts()`](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts)
 * inside the generated service worker file. This is  useful when you want to
 * let Workbox create your top-level service worker file, but want to include
 * some additional code, such as a push event listener.
 * @param {boolean} [config.inlineWorkboxRuntime=false] Whether the runtime code
 * for the Workbox library should be included in the top-level service worker,
 * or split into a separate file that needs to be deployed alongside the service
 * worker. Keeping the runtime separate means that users will not have to
 * re-download the Workbox code each time your top-level service worker changes.
 * @param {string} [config.navigateFallback] If specified, all
 * [navigation requests](https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading#first_what_are_navigation_requests)
 * for URLs that aren't precached will be fulfilled with the HTML at the URL
 * provided. You must pass in the URL of an HTML document that is listed in your
 * precache manifest. This is meant to be used in a Single Page App scenario, in
 * which you want all navigations to use common [App Shell HTML](https://developers.google.com/web/fundamentals/architecture/app-shell).
 * @param {Array<RegExp>} [config.navigateFallbackBlacklist] An optional array
 * of regular expressions that restricts which URLs the configured
 * `navigateFallback` behavior applies to. This is useful if only a subset of
 * your site's URLs should be treated as being part of a
 * [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If
 * both `navigateFallbackBlacklist` and `navigateFallbackWhitelist` are
 * configured, the blacklist takes precedent.
 * @param {Array<RegExp>} [config.navigateFallbackWhitelist] An optional array
 * of regular expressions that restricts which URLs the configured
 * `navigateFallback` behavior applies to. This is useful if only a subset of
 * your site's URLs should be treated as being part of a
 * [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If
 * both `navigateFallbackBlacklist` and `navigateFallbackWhitelist` are
 * configured, the blacklist takes precedent.
 * @param {boolean} [config.navigationPreload=false] Whether or not to enable
 * [navigation preload](https://developers.google.com/web/tools/workbox/modules/workbox-navigation-preload)
 * in the generated service worker. When set to true, you must also use
 * `runtimeCaching` to set up an appropriate response strategy that will match
 * navigation requests, and make use of the preloaded response.
 * @param {boolean|Object} [config.offlineGoogleAnalytics=false] Controls
 * whether or not to include support for
 * [offline Google Analytics](https://developers.google.com/web/tools/workbox/guides/enable-offline-analytics).
 * When `true`, the call to `workbox-google-analytics`'s `initialize()` will be
 * added to your generated service worker. When set to an `Object`, that object
 * will be passed in to the `initialize()` call, allowing you to customize the
 * behavior.
 * @param {Array<Object>} [config.runtimeCaching]
 * @param {string} [config.runtimeCaching[].method='GET'] The
 * [HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that
 * will match the generated route.
 * @param {string|RegExp|workbox.routing.Route~matchCallback} config.runtimeCaching[].urlPattern
 * The value that will be passed to workbox.routing.Router~registerRoute, used
 * to determine whether the generated route will match a given request.
 * @param {string|workbox.routing.Route~handlerCallback} config.runtimeCaching[].handler
 * Either the name of one of the [built-in strategy classes](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies),
 * or custom handler callback to use when the generated route matches.
 * @param {Object} [config.runtimeCaching[].options]
 * @param {Object} [config.runtimeCaching[].options.backgroundSync]
 * @param {string} config.runtimeCaching[].options.backgroundSync.name The
 * [`name` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.backgroundSync.Queue.html)
 * to use when creating the `BackgroundSyncPlugin`.
 * @param {Object} [config.runtimeCaching[].options.backgroundSync.options] The
 * [`options` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.backgroundSync.Queue.html)
 * to use when creating the `BackgroundSyncPlugin`.
 * @param {Object} [config.runtimeCaching[].options.broadcastUpdate]
 * @param {string} config.runtimeCaching[].options.broadcastUpdate.channelName
 * The [`channelName` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.broadcastUpdate.BroadcastCacheUpdate)
 * to use when creating the `BroadcastCacheUpdatePlugin`.
 * @param {Object} [config.runtimeCaching[].options.broadcastUpdate.options] The
 * [`options` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.broadcastUpdate.BroadcastCacheUpdate)
 * to use when creating the `BroadcastCacheUpdatePlugin`.
 * @param {Object} [config.runtimeCaching[].options.cacheableResponse]
 * @param {Array<Number>} [config.runtimeCaching[].options.cacheableResponse.statuses]
 * The [`status` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.cacheableResponse.CacheableResponse)
 * to use when creating the `CacheableResponsePlugin`.
 * @param {Object} [config.runtimeCaching[].options.cacheableResponse.headers]
 * The [`headers` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.cacheableResponse.CacheableResponse)
 * to use when creating the `CacheableResponsePlugin`.
 * @param {string} [config.runtimeCaching[].options.cacheName] The `cacheName`
 * to use when constructing one of the [Workbox strategy classes](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies).
 * @param {Object} [config.runtimeCaching[].options.expiration]
 * @param {Number} [config.runtimeCaching[].options.expiration.maxAgeSeconds]
 * The [`maxAgeSeconds` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.expiration.CacheExpiration)
 * to use when creating the `CacheExpirationPlugin`.
 * @param {Number} [config.runtimeCaching[].options.expiration.maxEntries]
 * The [`maxAgeSeconds` parameter](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.expiration.CacheExpiration)
 * to use when creating the `CacheExpirationPlugin`.
 * @return {Promise<{count: number, filePaths: Array<string>, size: number, warnings: Array<string>}>}
 * A promise that resolves once the service worker and related files
 * (indicated by `filePaths`) has been written to `swDest`. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, and the
 * `count` property contains the total number of precached entries. Any
 * non-fatal warning messages will be returned via `warnings`.
 *
 * @memberof module:workbox-build
 */
async function generateSW(config) {
  const options = validate(config, generateSWSchema);

  if (options.globDirectory) {
    // Make sure we leave swDest out of the precache manifest.
    options.globIgnores.push(rebasePath({
      baseDirectory: options.globDirectory,
      file: options.swDest,
    }));

    // If we create an extra external runtime file, ignore that, too.
    // See https://rollupjs.org/guide/en/#outputchunkfilenames for naming.
    if (!options.inlineWorkboxRuntime) {
      const swDestDir = upath.dirname(options.swDest);
      const workboxRuntimeFile = upath.join(swDestDir, 'workbox-*.js');
      options.globIgnores.push(rebasePath({
        baseDirectory: options.globDirectory,
        file: workboxRuntimeFile,
      }));
    }
  }

  const {count, size, manifestEntries, warnings} =
    await getFileManifestEntries(options);

  const filePaths = await writeServiceWorkerUsingDefaultTemplate(Object.assign({
    manifestEntries,
  }, options));

  return {count, filePaths, size, warnings};
}

module.exports = generateSW;

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const generateSWSchema = require('./options/schema/generate-sw');
const getFileManifestEntries = require('./lib/get-file-manifest-entries');
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

  const {count, size, manifestEntries, warnings} =
    await getFileManifestEntries(options);

  const filePaths = await writeServiceWorkerUsingDefaultTemplate(Object.assign({
    manifestEntries,
  }, options));

  return {count, filePaths, size, warnings};
}

module.exports = generateSW;

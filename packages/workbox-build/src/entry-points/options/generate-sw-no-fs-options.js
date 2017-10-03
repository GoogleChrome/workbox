const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the generate-sw-no-fs entry point.
 */
class GenerateSWNoFSOptions extends BaseOptions {
  /**
   * @param {Object} options
   */
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      cacheId: joi.string(),
      clientsClaim: joi.boolean(),
      directoryIndex: joi.string(),
      globDirectory: joi.string(),
      handleFetch: joi.boolean(),
      ignoreUrlParametersMatching: joi.array().items(joi.object().type(RegExp)),
      importScripts: joi.array().items(joi.string()).required(),
      navigateFallback: joi.string(),
      navigateFallbackWhitelist: joi.array().items(joi.object().type(RegExp)),
      runtimeCaching: joi.array().items(joi.object().keys({
        urlPattern: [joi.object().type(RegExp), joi.string()],
        handler: [joi.func(), joi.string().valid(
          'cacheFirst',
          'cacheOnly',
          'networkFirst',
          'networkOnly',
          'staleWhileRevalidate'
        )],
        options: joi.object().keys({
          cacheName: joi.string(),
          plugins: joi.array().items(joi.object()),
          cacheExpiration: joi.object().keys({
            maxEntries: joi.number().min(1),
            maxAgeSeconds: joi.number().min(1),
          }).or('maxEntries', 'maxAgeSeconds'),
          cacheableResponse: joi.object().keys({
            statuses: joi.array().items(joi.number().min(0).max(599)),
            headers: joi.object(),
          }).or('statuses', 'headers'),
        }),
      }).requiredKeys('urlPattern', 'handler')),
      skipWaiting: joi.boolean(),
    });

    super(options, schema);
  }
}

module.exports = GenerateSWNoFSOptions;

const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the generate-sw entry point.
 */
class GenerateSWOptions extends BaseOptions {
  /**
   * @param {Object} options
   */
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      cacheId: joi.string(),
      clientsClaim: joi.boolean(),
      directoryIndex: joi.string(),
      globDirectory: joi.string().required(),
      handleFetch: joi.boolean(),
      ignoreUrlParametersMatching: joi.array().items(joi.object().type(RegExp)),
      importScripts: joi.array().items(joi.string()),
      importWorkboxFromCDN: joi.boolean().default(true),
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
      swDest: joi.string().required(),
    });

    super(options, schema);
  }
}

module.exports = GenerateSWOptions;

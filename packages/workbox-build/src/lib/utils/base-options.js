const joi = require('joi');

const SCHEMA = joi.object().keys({
  swDest: joi.string(),
  swSrc: joi.string(),
  globPatterns: joi.array().items(joi.string()),
  templatedUrls: [joi.string(), joi.array().items(joi.string())],
  maximumFileSizeToCacheInBytes: joi.number().min(1),
  manifestTransforms: joi.array().items(joi.func()),
  modifyUrlPrefix: joi.object(),
  dontCacheBustUrlsMatching: joi.object().type(RegExp),
  navigateFallback: joi.string(),
  navigateFallbackWhitelist: joi.array().items(joi.object().type(RegExp)),
  cacheId: joi.string(),
  skipWaiting: joi.boolean(),
  clientsClaim: joi.boolean(),
  directoryIndex: joi.string(),
  runtimeCaching: joi.array().items(joi.object().keys({
    urlPattern: [joi.object().type(RegExp), joi.string()],
    handler: [joi.func(), joi.string()],
    options: joi.object(),
  }).requiredKeys('urlPattern', 'handler')),
});

/**
 *
 */
class BaseOptions {
  /**
   * Performs validation and assigns default values for all the options.
   * @param {Object} options The options to initialize this class with;
   * will be validated based on the set of supported options.
   * @throws {Error} Will throw an Error if validation fails.
   */
  constructor(options) {
    this._schema = SCHEMA;
    const {value, error} = this._schema.validate(options);
    if (error) {
      throw Error(error);
    }
    this._options = value;
  }

  /**
   * @return {Object} The validated set of options.
   */
  get() {
    return this._options;
  }
}

module.exports = BaseOptions;

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
      globDirectory: joi.string().required(),
      importScripts: joi.array().items(joi.string()),
      importWorkboxFromCDN: joi.boolean().default(true),
      navigateFallback: joi.string(),
      navigateFallbackWhitelist: joi.array().items(joi.object().type(RegExp)),
      runtimeCaching: joi.array().items(joi.object().keys({
        urlPattern: [joi.object().type(RegExp), joi.string()],
        handler: [joi.func(), joi.string()],
        options: joi.object(),
      }).requiredKeys('urlPattern', 'handler')),
      swDest: joi.string().required(),
    });

    super(options, schema);
  }
}

module.exports = GenerateSWOptions;

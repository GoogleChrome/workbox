const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the generate-sw entry point.
 */
class GenerateSWOptions extends BaseOptions {
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      navigateFallback: joi.string(),
      navigateFallbackWhitelist: joi.array().items(joi.object().type(RegExp)),
      runtimeCaching: joi.array().items(joi.object().keys({
        urlPattern: [joi.object().type(RegExp), joi.string()],
        handler: [joi.func(), joi.string()],
        options: joi.object(),
      }).requiredKeys('urlPattern', 'handler')),
    });

    super(options, schema);
  }
}

module.exports = GenerateSWOptions;

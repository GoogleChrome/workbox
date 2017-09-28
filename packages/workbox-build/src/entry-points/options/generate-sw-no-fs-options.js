const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the generate-sw-no-fs entry point.
 */
class GenerateSWNoFSOptions extends BaseOptions {
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      globDirectory: joi.string(),
      importScripts: joi.array().items(joi.string()).required(),
      navigateFallback: joi.string(),
      navigateFallbackWhitelist: joi.array().items(joi.object().type(RegExp)),
      runtimeCaching: joi.array().items(joi.object().keys({
        urlPattern: [joi.object().type(RegExp), joi.string()],
        handler: [joi.func(), joi.string()],
        options: joi.object(),
      }).requiredKeys('urlPattern', 'handler')),
      swTemplate: joi.string().required(),
    });

    super(options, schema);
  }
}

module.exports = GenerateSWNoFSOptions;

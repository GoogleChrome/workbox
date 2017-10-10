const joi = require('joi');

const SCHEMA = joi.object().keys({
  dontCacheBustUrlsMatching: joi.object().type(RegExp),
  globIgnores: joi.array().items(joi.string()).default([
    'node_modules/**/*',
  ]),
  globPatterns: joi.array().items(joi.string()).default([
    '**/*.{js,css,html}',
  ]),
  manifestTransforms: joi.array().items(joi.func().arity(1)),
  maximumFileSizeToCacheInBytes: joi.number().min(1).default(2 * 1024 * 1024),
  modifyUrlPrefix: joi.object(),
  // templatedUrls is an object where any property name is valid, and the values
  // can be either a string or an array of strings.
  templatedUrls: joi.object().pattern(/./,
    [joi.string(), joi.array().items(joi.string())]),
});

/**
 *
 */
class BaseOptions {
  /**
   * @return {Object} The Joi schema.
   */
  static get schema() {
    return SCHEMA;
  }

  /**
   * Performs validation and assigns default values for all the options.
   *
   * @param {Object} [options] The options to initialize this class with;
   * will be validated based on the set of supported options.
   * @param {Object} [schema] The schema to use when validating options.
   * If not provided, the default schema will be used.
   * @throws {Error} Will throw an Error if validation fails.
   */
  constructor(options = {}, schema = BaseOptions.schema) {
    const {value, error} = schema.validate(options, {
      language: {
        object: {
          allowUnknown: 'is not a supported parameter.',
        },
      },
    });

    if (error) {
      throw error;
    }

    Object.assign(this, value);
  }
}

module.exports = BaseOptions;

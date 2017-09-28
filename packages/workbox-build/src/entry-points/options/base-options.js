const joi = require('joi');

const SCHEMA = joi.object().keys({
  cacheId: joi.string(),
  clientsClaim: joi.boolean(),
  directoryIndex: joi.string(),
  dontCacheBustUrlsMatching: joi.object().type(RegExp),
  globDirectory: joi.string().required(),
  globIgnores: joi.array().items(joi.string()).default([
    'node_modules/**/*',
  ]),
  globPatterns: joi.array().items(joi.string()).default([
    '**/*.{js,css,html}',
  ]),
  ignoreUrlParametersMatching: joi.array().items(joi.object().type(RegExp)),
  manifestTransforms: joi.array().items(joi.func()),
  maximumFileSizeToCacheInBytes: joi.number().min(1).default(2 * 1024 * 1024),
  modifyUrlPrefix: joi.object(),
  skipWaiting: joi.boolean(),
  swDest: joi.string().required(),
  templatedUrls: [joi.string(), joi.array().items(joi.string())],
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
      throw Error(error);
    }

    Object.assign(this, value);
  }
}

module.exports = BaseOptions;

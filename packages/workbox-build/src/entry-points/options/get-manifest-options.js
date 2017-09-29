const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the get-manifest entry point.
 */
class GetManifestOptions extends BaseOptions {
  /**
   * @param {Object} options
   */
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      globDirectory: joi.string().required(),
    });

    super(options, schema);
  }
}

module.exports = GetManifestOptions;

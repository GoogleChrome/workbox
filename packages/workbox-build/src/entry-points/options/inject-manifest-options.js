const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the inject-manifest entry point.
 */
class InjectManifestOptions extends BaseOptions {
  /**
   * @param {Object} options
   */
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      globDirectory: joi.string().required(),
      injectionPointRegexp: joi.object().type(RegExp)
        .default(/(\.precache\()\s*\[\s*\]\s*(\))/),
      swSrc: joi.string().required(),
      swDest: joi.string().required(),
    });

    super(options, schema);
  }
}

module.exports = InjectManifestOptions;

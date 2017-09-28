const joi = require('joi');

const BaseOptions = require('./base-options');

/**
 * Options specific to the inject-manifest entry point.
 */
class InjectManifestOptions extends BaseOptions {
  constructor(options) {
    // Add in some additional constraints.
    const schema = BaseOptions.schema.keys({
      injectionPointRegexp: joi.object().type(RegExp)
        .default(/(\.precache\()\s*\[\s*\]\s*(\))/),
      swSrc: joi.string().required(),
    });

    super(options, schema);
  }
}

module.exports = InjectManifestOptions;

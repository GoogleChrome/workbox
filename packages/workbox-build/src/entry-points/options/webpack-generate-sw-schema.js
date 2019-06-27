/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const commonGenerateSchema = require('./common-generate-schema');
const defaults = require('./defaults');
const regExpObject = require('./reg-exp-object');

module.exports = commonGenerateSchema.keys({
  chunks: joi.array().items(joi.string()),
  exclude: joi.array().items(joi.string(), regExpObject)
      .default(defaults.exclude),
  excludeChunks: joi.array().items(joi.string()),
  include: joi.array().items(joi.string(), regExpObject),
  swDest: joi.string().default(defaults.swDestFilename),
});

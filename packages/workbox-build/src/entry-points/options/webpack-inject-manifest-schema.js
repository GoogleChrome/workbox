/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');
const upath = require('upath');

const baseSchema = require('./base-schema');
const defaults = require('./defaults');
const regExpObject = require('./reg-exp-object');

// See https://github.com/hapijs/joi/blob/v16.0.0-rc2/API.md#anydefaultvalue-description
const swSrcBasename = (context) => upath.basename(context.swSrc);
swSrcBasename.description = 'derived from the swSrc file name';

module.exports = baseSchema.keys({
  chunks: joi.array().items(joi.string()),
  exclude: joi.array().items(joi.string(), regExpObject)
      .default(defaults.exclude),
  excludeChunks: joi.array().items(joi.string()),
  include: joi.array().items(joi.string(), regExpObject),
  injectionPoint: joi.string().default(defaults.injectionPoint),
  swDest: joi.string().default(swSrcBasename),
  swSrc: joi.string().required(),
});

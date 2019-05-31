/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const baseSchema = require('./base-schema');
const defaults = require('./defaults');

module.exports = baseSchema.keys({
  globDirectory: joi.string().required(),
  injectionPoint: joi.string().default(defaults.injectionPoint),
  swSrc: joi.string().required(),
  swDest: joi.string().required().regex(/\.js$/),
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const commonGenerateSchema = require('./common-generate-schema');
const defaults = require('./defaults');

// Define some additional constraints.
module.exports = commonGenerateSchema.keys({
  babelPresetEnvTargets: joi.array().items(joi.string())
      .default(defaults.babelPresetEnvTargets),
  globDirectory: joi.string().required(),
  importScripts: joi.array().items(joi.string()),
  inlineWorkboxRuntime: joi.boolean().default(defaults.inlineWorkboxRuntime),
  mode: joi.string().default(process.env.NODE_ENV || defaults.mode),
  sourcemap: joi.boolean().default(defaults.sourcemap),
  swDest: joi.string().required().regex(/\.js$/),
});

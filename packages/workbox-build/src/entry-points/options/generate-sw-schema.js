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
  globDirectory: joi.string().required(),
  importScripts: joi.array().items(joi.string()),
  importWorkboxFrom: joi.string().default(defaults.importWorkboxFrom).valid(
      'cdn',
      'local',
      'disabled'
  ),
  swDest: joi.string().required(),
});

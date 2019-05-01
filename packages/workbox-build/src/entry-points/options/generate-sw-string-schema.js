/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const commonGenerateSchema = require('./common-generate-schema');

// Define some additional constraints.
module.exports = commonGenerateSchema.keys({
  globDirectory: joi.string(),
  importScripts: joi.array().items(joi.string()).required(),
  modulePathPrefix: joi.string(),
  workboxSWImport: joi.string(),
});

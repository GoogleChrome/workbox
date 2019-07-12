/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const commonGenerateSchema = require('./common-generate-schema');
const defaults = require('./defaults');
const webpackCommon = require('./webpack-common');

module.exports = commonGenerateSchema.keys(Object.assign({
  swDest: joi.string().default(defaults.swDestFilename),
}, webpackCommon));

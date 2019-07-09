/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');
const upath = require('upath');

const baseSchema = require('./base-schema');
const defaults = require('./defaults');
const webpackCommon = require('./webpack-common');

// See https://github.com/hapijs/joi/blob/v16.0.0-rc2/API.md#anydefaultvalue-description
const swSrcBasename = (context) => upath.basename(context.swSrc);
swSrcBasename.description = 'derived from the swSrc file name';

module.exports = baseSchema.keys(Object.assign({
  injectionPoint: joi.string().default(defaults.injectionPoint),
  swSrc: joi.string().required(),
  webpackCompilationPlugins: joi.array().items(joi.object()),
}, webpackCommon)).keys({
  // List this separately, so that the swSrc validation happens first.
  swDest: joi.string().default(swSrcBasename),
});

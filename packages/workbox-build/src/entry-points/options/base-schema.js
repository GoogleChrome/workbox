/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const defaults = require('./defaults');
const regExpObject = require('./reg-exp-object');

// Define some common constraints used by all methods.
module.exports = joi.object().keys({
  dontCacheBustURLsMatching: regExpObject,
  globFollow: joi.boolean().default(defaults.globFollow),
  globIgnores: joi.array().items(joi.string()).default(defaults.globIgnores),
  globPatterns: joi.array().items(joi.string()).default(defaults.globPatterns),
  globStrict: joi.boolean().default(defaults.globStrict),
  manifestTransforms: joi.array().items(joi.func().arity(1)),
  maximumFileSizeToCacheInBytes: joi.number().min(1)
      .default(defaults.maximumFileSizeToCacheInBytes),
  modifyURLPrefix: joi.object(),
  // templatedURLs is an object where any property name is valid, and the values
  // can be either a string or an array of strings.
  templatedURLs: joi.object().pattern(/./,
      [joi.string(), joi.array().items(joi.string())]),
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const defaults = require('./defaults');
const manifestEntryObject = require('./manifest-entry-object');
const regExpObject = require('./reg-exp-object');

// Define some common constraints used by all methods.
module.exports = joi.object().keys({
  additionalManifestEntries: joi.array()
      .items(joi.string(), manifestEntryObject),
  dontCacheBustURLsMatching: regExpObject,
  manifestTransforms: joi.array().items(joi.func().minArity(1).maxArity(2)),
  maximumFileSizeToCacheInBytes: joi.number().min(1)
      .default(defaults.maximumFileSizeToCacheInBytes),
  mode: joi.string().default(process.env.NODE_ENV || defaults.mode),
  modifyURLPrefix: joi.object(),
  // templatedURLs is an object where any property name is valid, and the values
  // can be either a string or an array of strings.
  templatedURLs: joi.object().pattern(/./,
      [joi.string(), joi.array().items(joi.string())]),
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('@hapi/joi');

const baseSchema = require('./base-schema');
const defaults = require('./defaults');
const regExpObject = require('./reg-exp-object');

module.exports = baseSchema.keys({
  globDirectory: joi.string().required(),
  injectionPointRegexp: regExpObject.default(defaults.injectionPointRegexp),
  swSrc: joi.string().required(),
  swDest: joi.string().required(),
});

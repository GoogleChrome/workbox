/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('joi');

const baseSchema = require('./base-schema');

// Define some additional constraints.
module.exports = baseSchema.keys({
  globDirectory: joi.string(),
});

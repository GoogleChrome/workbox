/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {registerQuotaErrorCallback} from './_private/quota.mjs';
import * as _private from './_private.mjs';
import defaultExport from './_default.mjs';
import LOG_LEVELS from './models/LogLevels.mjs';

import './_version.mjs';

const finalExports = Object.assign(defaultExport, {
  _private,
  LOG_LEVELS,
  registerQuotaErrorCallback,
});

export default finalExports;

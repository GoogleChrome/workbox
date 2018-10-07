/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import * as publicAPI from './_public.mjs';
import defaultExport from './_default.mjs';
import './_version.mjs';

const finalExport = Object.assign(defaultExport, publicAPI);

export default finalExport;

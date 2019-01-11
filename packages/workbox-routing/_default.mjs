/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {DefaultRouter} from './DefaultRouter.mjs';
import './_version.mjs';


if (process.env.NODE_ENV !== 'production') {
  assert.isSWEnv('workbox-routing');
}

export default new DefaultRouter();

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheFirst} from './CacheFirst.mjs';
import {CacheOnly} from './CacheOnly.mjs';
import {NetworkFirst} from './NetworkFirst.mjs';
import {NetworkOnly} from './NetworkOnly.mjs';
import {StaleWhileRevalidate} from './StaleWhileRevalidate.mjs';
import './_version.mjs';

export {
  CacheFirst,
  CacheOnly,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
};

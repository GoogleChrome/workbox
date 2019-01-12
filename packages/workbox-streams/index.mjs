/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {concatenate} from './concatenate.mjs';
import {concatenateToResponse} from './concatenateToResponse.mjs';
import {isSupported} from './isSupported.mjs';
import {strategy} from './strategy.mjs';
import './_version.mjs';


/**
 * @namespace workbox.streams
 */

export {
  concatenate,
  concatenateToResponse,
  isSupported,
  strategy,
};

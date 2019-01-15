/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {precachePlugins} from './utils/precachePlugins.mjs';
import './_version.mjs';


/**
 * Adds plugins to precaching.
 *
 * @param {Array<Object>} newPlugins
 *
 * @alias workbox.precaching.addPlugins
 */
const addPlugins = (newPlugins) => {
  precachePlugins.add(newPlugins);
};

export {addPlugins};

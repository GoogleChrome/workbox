/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {getModuleURL} from './lib/cdn-utils';
import copyWorkboxLibraries from './lib/copy-workbox-libraries';
import generateSW from './generate-sw';
import getManifest from './get-manifest';
import injectManifest from './inject-manifest';

/**
 * @module workbox-build
 */
export default {
  copyWorkboxLibraries,
  generateSW,
  getManifest,
  getModuleURL,
  injectManifest,
};

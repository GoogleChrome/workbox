/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {copyWorkboxLibraries} from './lib/copy-workbox-libraries';
import {getModuleURL} from './lib/cdn-utils';
import {generateSW} from './generate-sw';
import {getManifest} from './get-manifest';
import {injectManifest} from './inject-manifest';
import {
  validateWebpackGenerateSWOptions,
  validateWebpackInjectManifestOptions,
} from './lib/validate-options';
import {bundle} from './lib/bundle';
import {populateSWTemplate} from './lib/populate-sw-template';
import {escapeRegExp} from './lib/escape-regexp';
import {replaceAndUpdateSourceMap} from './lib/replace-and-update-source-map';
import {transformManifest} from './lib/transform-manifest';

/**
 * @module workbox-build
 */
export {
  copyWorkboxLibraries,
  bundle,
  escapeRegExp,
  generateSW,
  getManifest,
  getModuleURL,
  injectManifest,
  populateSWTemplate,
  replaceAndUpdateSourceMap,
  transformManifest,
  validateWebpackGenerateSWOptions,
  validateWebpackInjectManifestOptions,
};

export * from './types';

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {isGenerateSWOptions, isGetManifestOptions, isInjectManifestOptions} from '../types.guard';
import {GenerateSWOptions, GetManifestOptions, InjectManifestOptions} from '../types';

const defaults = {
  babelPresetEnvTargets: ['chrome >= 56'],
  cleanupOutdatedCaches: false,
  clientsClaim: false,
  compileSrc: true,
  disableDevLogs: false,
  exclude: [
    /\.map$/,
    /^manifest.*\.js$/,
  ],
  globFollow: true,
  globIgnores: ['**/node_modules/**/*'],
  globPatterns: ['**/*.{js,css,html}'],
  globStrict: true,
  injectionPoint: 'self.__WB_MANIFEST',
  inlineWorkboxRuntime: false,
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  mode: 'production',
  navigateFallback: null,
  navigationPreload: false,
  offlineGoogleAnalytics: false,
  purgeOnQuotaError: true,
  skipWaiting: false,
  sourcemap: true,
  swDestFilename: 'service-worker.js',
};

export function validateGenerateSWOptions(input: unknown): GenerateSWOptions {
  const optionsWithDefaults = Object.assign({}, defaults, input);
  if(isGenerateSWOptions(optionsWithDefaults)) {
    return optionsWithDefaults;
  } else {
    throw new Error('Validation failed.');
  }
}

export function validateGetManifestOptions(input: unknown): GetManifestOptions {
  const optionsWithDefaults = Object.assign({}, defaults, input);
  if(isGetManifestOptions(optionsWithDefaults)) {
    return optionsWithDefaults;
  } else {
    throw new Error('Validation failed.');
  }
}

export function validateInjectManifestOptions(input: unknown): InjectManifestOptions {
  const optionsWithDefaults = Object.assign({}, defaults, input);
  if(isInjectManifestOptions(optionsWithDefaults)) {
    return optionsWithDefaults;
  } else {
    throw new Error('Validation failed.');
  }
}

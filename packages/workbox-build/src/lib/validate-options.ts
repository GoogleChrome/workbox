/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import Ajv, {DefinedError, JSONSchemaType} from 'ajv';

import {GenerateSWOptions, GetManifestOptions, InjectManifestOptions} from '../types';

const ajv = new Ajv();

// const defaults = {
//   babelPresetEnvTargets: ['chrome >= 56'],
//   cleanupOutdatedCaches: false,
//   clientsClaim: false,
//   compileSrc: true,
//   disableDevLogs: false,
//   exclude: [
//     /\.map$/,
//     /^manifest.*\.js$/,
//   ],
//   globFollow: true,
//   globIgnores: ['**/node_modules/**/*'],
//   globPatterns: ['**/*.{js,css,html}'],
//   globStrict: true,
//   injectionPoint: 'self.__WB_MANIFEST',
//   inlineWorkboxRuntime: false,
//   maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
//   mode: 'production',
//   navigateFallback: null,
//   navigationPreload: false,
//   offlineGoogleAnalytics: false,
//   purgeOnQuotaError: true,
//   skipWaiting: false,
//   sourcemap: true,
//   swDestFilename: 'service-worker.js',
// };

export function validateGenerateSWOptions(input: unknown): GenerateSWOptions {
  const jsonSchema: JSONSchemaType<GenerateSWOptions> =
    require(`../schema/GenerateSWOptions.json`);
  const validate = ajv.compile(jsonSchema);
  if (validate(input)) {
    return input;
  }

  const errorStrings = [];
  for (const err of validate.errors as DefinedError[]) {
    errorStrings.push(err.message);
  }
  throw new Error(`Incorrect generateSW options:\n\t${errorStrings.join('\n\t')}`);
}

export function validateGetManifestOptions(input: unknown): GetManifestOptions {
  const jsonSchema: JSONSchemaType<GetManifestOptions> =
    require(`../schema/GetManifestOptions.json`);
  const validate = ajv.compile(jsonSchema);
  if (validate(input)) {
    return input;
  }

  const errorStrings = [];
  for (const err of validate.errors as DefinedError[]) {
    errorStrings.push(err.message);
  }
  throw new Error(`Incorrect getManifest options:\n\t${errorStrings.join('\n\t')}`);
}

export function validateInjectManifestOptions(input: unknown): InjectManifestOptions {
  const jsonSchema: JSONSchemaType<InjectManifestOptions> =
    require(`../schema/InjectManifestOptions.json`);
  const validate = ajv.compile(jsonSchema);
  if (validate(input)) {
    return input;
  }

  const errorStrings = [];
  for (const err of validate.errors as DefinedError[]) {
    errorStrings.push(err.message);
  }
  throw new Error(`Incorrect injectManifestOptions options:\n\t${errorStrings.join('\n\t')}`);
}

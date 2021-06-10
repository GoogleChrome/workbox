/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import Ajv, {JSONSchemaType} from 'ajv';

import {
  GenerateSWOptions,
  GetManifestOptions,
  InjectManifestOptions,
  WebpackGenerateSWOptions,
  WebpackInjectManifestOptions,
} from '../types';

const ajv = new Ajv({
  useDefaults: true,
});

const DEFAULT_EXCLUDE_VALUE= [/\.map$/, /^manifest.*\.js$/];

function validate<T>(input: unknown, schemaFile: string): T {
  // Don't mutate input: https://github.com/GoogleChrome/workbox/issues/2158
  const inputCopy = Object.assign({}, input);
  const jsonSchema: JSONSchemaType<T> = require(schemaFile);
  const validate = ajv.compile(jsonSchema);
  if (validate(inputCopy)) {
    return inputCopy;
  }

  // TODO: Update this code to use better-ajv-errors once
  // https://github.com/apideck-libraries/better-ajv-errors/pull/2 is merged.
  const error = new Error(JSON.stringify(validate.errors));
  error.name = 'ValidationError';
  throw error;
}

export function validateGenerateSWOptions(input: unknown): GenerateSWOptions {
  return validate<GenerateSWOptions>(input, '../schema/GenerateSWOptions.json');
}

export function validateGetManifestOptions(input: unknown): GetManifestOptions {
  return validate<GetManifestOptions>(input, '../schema/GetManifestOptions.json');
}

export function validateInjectManifestOptions(input: unknown): InjectManifestOptions {
  return validate<InjectManifestOptions>(input, '../schema/InjectManifestOptions.json');
}

// The default exclude: [/\.map$/, /^manifest.*\.js$/] value can't be
// represented in the JSON schema, so manually set it for the webpack options.
export function validateWebpackGenerateSWOptions(input: unknown): WebpackGenerateSWOptions {
  const inputWithExcludeDefault = Object.assign({
    // Make a copy, as exclude can be mutated when used.
    exclude: Array.from(DEFAULT_EXCLUDE_VALUE),
  }, input);
  return validate<WebpackGenerateSWOptions>(inputWithExcludeDefault, '../schema/WebpackGenerateSWOptions.json');
}

export function validateWebpackInjectManifestOptions(input: unknown): WebpackInjectManifestOptions {
  const inputWithExcludeDefault = Object.assign({
    // Make a copy, as exclude can be mutated when used.
    exclude: Array.from(DEFAULT_EXCLUDE_VALUE),
  }, input);
  return validate<WebpackInjectManifestOptions>(inputWithExcludeDefault, '../schema/WebpackInjectManifestOptions.json');
}

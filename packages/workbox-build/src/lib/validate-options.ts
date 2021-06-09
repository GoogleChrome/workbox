/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import Ajv, {JSONSchemaType} from 'ajv';

import {GenerateSWOptions, GetManifestOptions, InjectManifestOptions} from '../types';

const ajv = new Ajv({
  useDefaults: true,
});

function validate<T>(input: unknown, schemaFile: string): T {
  const jsonSchema: JSONSchemaType<T> = require(schemaFile);
  const validate = ajv.compile(jsonSchema);
  if (validate(input)) {
    return input;
  }

  // TODO: Update this code to use better-ajv-errors once
  // https://github.com/apideck-libraries/better-ajv-errors/pull/2 is merged.
  const error = new Error(JSON.stringify(validate.errors));
  error.name = 'ValidationError';
  throw error;
}

export function validateGenerateSWOptions(input: unknown): GenerateSWOptions {
  return validate<GenerateSWOptions>(input, `../schema/GenerateSWOptions.json`);
}

export function validateGetManifestOptions(input: unknown): GetManifestOptions {
  return validate<GetManifestOptions>(input, `../schema/GetManifestOptions.json`);
}

export function validateInjectManifestOptions(input: unknown): InjectManifestOptions {
  return validate<InjectManifestOptions>(input, `../schema/InjectManifestOptions.json`);
}

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import Ajv, {DefinedError, JSONSchemaType} from 'ajv';

import {GenerateSWOptions, GetManifestOptions, InjectManifestOptions} from '../types';

const ajv = new Ajv({useDefaults: true});

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

  const errors = validate.errors as DefinedError[];
  throw new Error(JSON.stringify(errors));
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

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {betterAjvErrors} from '@apideck/better-ajv-errors';
import {oneLine as ol} from 'common-tags';
import Ajv, {JSONSchemaType} from 'ajv';
import ajvKeywords from 'ajv-keywords';

import {
  GenerateSWOptions,
  GetManifestOptions,
  InjectManifestOptions,
  WebpackGenerateSWOptions,
  WebpackInjectManifestOptions,
} from '../types';

type MethodNames = 'GenerateSW' | 'GetManifest' | 'InjectManifest' |
  'WebpackGenerateSW' | 'WebpackInjectManifest';

const ajv = new Ajv({
  useDefaults: true,
});
ajvKeywords(ajv, ['typeof']);

const DEFAULT_EXCLUDE_VALUE= [/\.map$/, /^manifest.*\.js$/];

export class WorkboxConfigError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function validate<T>(input: unknown, methodName: MethodNames): T {
  // Don't mutate input: https://github.com/GoogleChrome/workbox/issues/2158
  const inputCopy = Object.assign({}, input);
  const jsonSchema: JSONSchemaType<T> = require(`../schema/${methodName}Options.json`);
  const validate = ajv.compile(jsonSchema);
  if (validate(inputCopy)) {
    return inputCopy;
  }

  const betterErrors = betterAjvErrors({
    basePath: methodName,
    data: input,
    errors: validate.errors,
    // This is needed as JSONSchema6 is expected, but JSONSchemaType works.
    schema: jsonSchema as any,
  });
  const messages = betterErrors.map((err) => ol`[${err.path}] ${err.message}.
    ${err.suggestion ? err.suggestion : ''}`);

  throw new WorkboxConfigError(messages.join('\n\n'));
}

export function validateGenerateSWOptions(input: unknown): GenerateSWOptions {
  return validate<GenerateSWOptions>(input, 'GenerateSW');
}

export function validateGetManifestOptions(input: unknown): GetManifestOptions {
  return validate<GetManifestOptions>(input, 'GetManifest');
}

export function validateInjectManifestOptions(input: unknown): InjectManifestOptions {
  return validate<InjectManifestOptions>(input, 'InjectManifest');
}

// The default `exclude: [/\.map$/, /^manifest.*\.js$/]` value can't be
// represented in the JSON schema, so manually set it for the webpack options.
export function validateWebpackGenerateSWOptions(input: unknown): WebpackGenerateSWOptions {
  const inputWithExcludeDefault = Object.assign({
    // Make a copy, as exclude can be mutated when used.
    exclude: Array.from(DEFAULT_EXCLUDE_VALUE),
  }, input);
  return validate<WebpackGenerateSWOptions>(inputWithExcludeDefault, 'WebpackGenerateSW');
}

export function validateWebpackInjectManifestOptions(input: unknown): WebpackInjectManifestOptions {
  const inputWithExcludeDefault = Object.assign({
    // Make a copy, as exclude can be mutated when used.
    exclude: Array.from(DEFAULT_EXCLUDE_VALUE),
  }, input);
  return validate<WebpackInjectManifestOptions>(inputWithExcludeDefault, 'WebpackInjectManifest');
}

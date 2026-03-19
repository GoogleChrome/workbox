/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import assert from 'assert';
import inquirer from 'inquirer';
import {oneLine as ol} from 'common-tags';

import {errors} from '../errors.js';
import {constants} from '../constants.js';

const START_URL_QUERY_PARAMS_PROMPT =
  'Please enter the search parameter(s) that you would like to ignore (separated by comma):';

type StartUrlAnswers = {
  shouldAskForIgnoreURLParametersMatching: boolean;
  ignoreURLParametersMatching?: string;
};

/**
 * @return {Promise<Object>} The answers from inquirer.
 */
async function askQuestion(): Promise<StartUrlAnswers> {
  const {shouldAskForIgnoreURLParametersMatching} = await inquirer.prompt<{
    shouldAskForIgnoreURLParametersMatching: boolean;
  }>([
    {
      name: 'shouldAskForIgnoreURLParametersMatching',
      message: ol`Does your web app manifest include search parameter(s)
      in the 'start_url', other than 'utm_' or 'fbclid'
      (like '?source=pwa')?`,
      type: 'confirm' as const,
      default: false,
    },
  ]);

  if (!shouldAskForIgnoreURLParametersMatching) {
    return {shouldAskForIgnoreURLParametersMatching};
  }

  const {ignoreURLParametersMatching} = await inquirer.prompt<{
    ignoreURLParametersMatching: string;
  }>([
    {
      name: 'ignoreURLParametersMatching',
      message: START_URL_QUERY_PARAMS_PROMPT,
      type: 'input' as const,
    },
  ]);

  return {
    shouldAskForIgnoreURLParametersMatching,
    ignoreURLParametersMatching,
  };
}

export async function askQueryParametersInStartUrl(
  defaultIgnoredSearchParameters: RegExp[] = constants.ignoreURLParametersMatching,
): Promise<RegExp[]> {
  const {
    shouldAskForIgnoreURLParametersMatching,
    ignoreURLParametersMatching = '',
  } = await askQuestion();

  if (!shouldAskForIgnoreURLParametersMatching) {
    return defaultIgnoredSearchParameters;
  }

  assert(
    ignoreURLParametersMatching.length > 0,
    errors['no-search-parameters-supplied'],
  );

  const ignoreSearchParameters = ignoreURLParametersMatching
    .trim()
    .split(',')
    .filter(Boolean);

  assert(
    ignoreSearchParameters.length > 0,
    errors['no-search-parameters-supplied'],
  );
  assert(
    ignoreSearchParameters.every((param) => !param.match(/^[^\w|-]/g)),
    errors['invalid-search-parameters-supplied'],
  );

  return defaultIgnoredSearchParameters.concat(
    ignoreSearchParameters.map((searchParam) => new RegExp(`^${searchParam}`)),
  );
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import assert from 'assert';
import {Answers, Question, prompt} from 'inquirer';
import {oneLine as ol} from 'common-tags';

import {constants} from '../constants';
import {errors} from '../errors';

// The key used for the question/answer.
const name = 'configLocation';

const configLocationQuestion: Question<Answers> = {
  name,
  message: ol`Where would you like to save these configuration options?`,
  type: 'input',
  default: constants.defaultConfigFile,
};
/**
 * @return {Promise<Answers>} The answers from inquirer.
 */
function askQuestion(): Promise<Answers> {
  return prompt([configLocationQuestion]);
}

export async function askConfigLocation(): Promise<string> {
  const answers = await askQuestion();
  // The value of the answer when the question type is 'input' is String
  // and it has a default value, the casting is safe.
  const configLocation: string = (answers[name] as string).trim();

  assert(configLocation, errors['invalid-config-location']);

  return configLocation;
}

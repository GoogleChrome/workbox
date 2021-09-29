/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import assert from 'assert';
import {Answers, prompt} from 'inquirer';
import upath from 'upath';

import {errors} from '../errors';

// The key used for the question/answer.
const name = 'swDest';

/**
 * @param {string} defaultDir
 * @return {Promise<Answers>} The answers from inquirer.
 */
function askQuestion(defaultDir: string): Promise<Answers> {
  return prompt([
    {
      name,
      message: `Where would you like your service worker file to be saved?`,
      type: 'input',
      default: upath.join(defaultDir, 'sw.js'),
    },
  ]);
}

export async function askSWDest(defaultDir = '.'): Promise<string> {
  const answers = await askQuestion(defaultDir);
  // When prompt type is input the return type is string
  // casting is safe
  const swDest: string = (answers[name] as string).trim();

  assert(swDest, errors['invalid-sw-dest']);

  return swDest;
}

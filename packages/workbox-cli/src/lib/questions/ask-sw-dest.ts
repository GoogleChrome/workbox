/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import * as assert from 'assert';
import {prompt} from 'inquirer';
import * as upath from 'upath';

import {errors} from '../errors';

// The key used for the question/answer.
const name = 'swDest';

/**
 * @param {string} defaultDir
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion(defaultDir: string) {
  return prompt([{
    name,
    message: `Where would you like your service worker file to be saved?`,
    type: 'input',
    default: upath.join(defaultDir, 'sw.js'),
  }]);
}

export async function askSWDest(defaultDir = '.') {
  const answers = await askQuestion(defaultDir);
  const swDest = answers[name].trim();

  assert(swDest, errors['invalid-sw-dest']);

  return swDest;
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Answers, prompt} from 'inquirer';
import {oneLine as ol} from 'common-tags';

// The key used for the question/answer.
const name = 'swSrc';

/**
 * @return {Promise<Answers>} The answers from inquirer.
 */
function askQuestion(): Promise<Answers> {
  return prompt([
    {
      name,
      message: ol`Where's your existing service worker file? To be used with
      injectManifest, it should include a call to
      'self.__WB_MANIFEST'`,
      type: 'input',
    },
  ]);
}

export async function askSWSrc(): Promise<string | null> {
  const answers = await askQuestion();
  // When prompt type is input the return is string or null
  return answers[name] ? (answers[name] as string).trim() : null;
}

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import * as assert from 'assert';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import {prompt, Separator} from 'inquirer';
import {oneLine as ol} from 'common-tags';

import {errors} from '../errors';
import {constants} from '../constants';

const ROOT_PROMPT = 'Please enter the path to the root of your web app:';

// The key used for the question/answer.
const name = 'globDirectory';

/**
 * @return {Promise<Array<string>>} The subdirectories of the current
 * working directory, with hidden and ignored ones filtered out.
 */
async function getSubdirectories(): Promise<Array<string>> {
  return await new Promise((resolve, reject) => {
    glob('*/', {
      ignore: constants.ignoredDirectories.map((directory) => `${directory}/`),
    }, (error, directories) => {
      if (error) {
        reject(error);
      } else {
        resolve(directories);
      }
    });
  });
}

/**
 * @return {Promise<Object>} The answers from inquirer.
 */
async function askQuestion() {
  const subdirectories = await getSubdirectories();

  if (subdirectories.length > 0) {
    const manualEntryChoice = 'Manually enter path';
    return prompt([{
      name,
      type: 'list',
      message: ol`What is the root of your web app (i.e. which directory do
        you deploy)?`,
      choices: subdirectories.concat([
        new Separator().toString(),
        manualEntryChoice,
      ]),
    }, {
      name,
      when: (answers: { [x: string]: string }) => answers[name] === manualEntryChoice,
      message: ROOT_PROMPT,
    }]);
  } else {
    return prompt([{
      name,
      message: ROOT_PROMPT,
      default: '.',
    }]);
  }
}

export async function askRootOfWebApp() {
  const answers = await askQuestion();
  const globDirectory = answers[name];

  try {
    const stat = await fse.stat(globDirectory);
    assert(stat.isDirectory());
  } catch (error) {
    throw new Error(errors['glob-directory-invalid']);
  }

  return globDirectory;
}

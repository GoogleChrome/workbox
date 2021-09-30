/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import assert from 'assert';
import fse from 'fs-extra';
import glob from 'glob';
import {prompt, Separator} from 'inquirer';
import {oneLine as ol} from 'common-tags';

import {errors} from '../errors';
import {constants} from '../constants';

const ROOT_PROMPT = 'Please enter the path to the root of your web app:';

// The keys used for the questions/answers.
const questionRootDirectory = 'globDirectory';
const questionManualInput = 'manualDirectoryInput';

/**
 * @return {Promise<Array<string>>} The subdirectories of the current
 * working directory, with hidden and ignored ones filtered out.
 */
async function getSubdirectories(): Promise<Array<string>> {
  return await new Promise((resolve, reject) => {
    glob(
      '*/',
      {
        ignore: constants.ignoredDirectories.map(
          (directory) => `${directory}/`,
        ),
      },
      (error, directories) => {
        if (error) {
          reject(error);
        } else {
          resolve(directories);
        }
      },
    );
  });
}

/**
 * @return {Promise<Object>} The answers from inquirer.
 */
async function askQuestion(): Promise<{
  globDirectory: string;
  manualDirectoryInput?: string;
}> {
  const subdirectories: (string | InstanceType<typeof Separator>)[] =
    await getSubdirectories();

  if (subdirectories.length > 0) {
    const manualEntryChoice = 'Manually enter path';
    return prompt([
      {
        name: questionRootDirectory,
        type: 'list',
        message: ol`What is the root of your web app (i.e. which directory do
        you deploy)?`,
        choices: subdirectories.concat([new Separator(), manualEntryChoice]),
      },
      {
        name: questionManualInput,
        when: (answers: {globDirectory: string}) =>
          answers.globDirectory === manualEntryChoice,
        message: ROOT_PROMPT,
      },
    ]);
  }

  return prompt([
    {
      name: questionRootDirectory,
      message: ROOT_PROMPT,
      default: '.',
    },
  ]);
}

export async function askRootOfWebApp(): Promise<string> {
  const {manualDirectoryInput, globDirectory} = await askQuestion();

  try {
    const stat = await fse.stat(manualDirectoryInput || globDirectory);
    assert(stat.isDirectory());
  } catch (error) {
    throw new Error(errors['glob-directory-invalid']);
  }

  return manualDirectoryInput || globDirectory;
}

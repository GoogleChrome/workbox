/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import assert from 'assert';
import fse from 'fs-extra';
import {glob} from 'glob';
import inquirer from 'inquirer';
import {oneLine as ol} from 'common-tags';

import {errors} from '../errors.js';
import {constants} from '../constants.js';

const ROOT_PROMPT = 'Please enter the path to the root of your web app:';

async function getSubdirectories(): Promise<string[]> {
  return await glob('*/', {
    ignore: constants.ignoredDirectories.map((directory) => `${directory}/`),
  });
}

async function askQuestion(): Promise<{
  globDirectory: string;
  manualDirectoryInput?: string;
}> {
  const subdirectories = await getSubdirectories();

  if (subdirectories.length > 0) {
    const manualEntryChoice = 'Manually enter path';

    const {globDirectory} = await inquirer.prompt<{globDirectory: string}>([
      {
        name: 'globDirectory',
        type: 'list' as const,
        message: ol`What is the root of your web app (i.e. which directory do
        you deploy)?`,
        choices: [
          ...subdirectories,
          new inquirer.Separator(),
          manualEntryChoice,
        ],
      },
    ]);

    if (globDirectory === manualEntryChoice) {
      const {manualDirectoryInput} = await inquirer.prompt<{
        manualDirectoryInput: string;
      }>([
        {
          name: 'manualDirectoryInput',
          type: 'input' as const,
          message: ROOT_PROMPT,
        },
      ]);

      return {globDirectory, manualDirectoryInput};
    }

    return {globDirectory};
  }

  const {globDirectory} = await inquirer.prompt<{globDirectory: string}>([
    {
      name: 'globDirectory',
      type: 'input' as const,
      message: ROOT_PROMPT,
      default: '.',
    },
  ]);

  return {globDirectory};
}

export async function askRootOfWebApp(): Promise<string> {
  const {manualDirectoryInput, globDirectory} = await askQuestion();

  try {
    const stat = await fse.stat(manualDirectoryInput || globDirectory);
    assert(stat.isDirectory());
  } catch {
    throw new Error(errors['glob-directory-invalid']);
  }

  return manualDirectoryInput || globDirectory;
}

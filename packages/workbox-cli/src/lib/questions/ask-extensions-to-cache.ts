/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import assert from 'assert';
import {Answers, prompt} from 'inquirer';
import glob from 'glob';
import ora from 'ora';
import upath from 'upath';

import {errors} from '../errors';
import {constants} from '../constants';

// The key used for the question/answer.
const name = 'globPatterns';

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Array<string>>} The unique file extensions corresponding
 * to all of the files under globDirectory.
 */
async function getAllFileExtensions(globDirectory: string) {
  const files: string[] = await new Promise((resolve, reject) => {
    // Use a pattern to match any file that contains a '.', since that signifies
    // the presence of a file extension.
    glob(
      '**/*.*',
      {
        cwd: globDirectory,
        nodir: true,
        ignore: [
          ...constants.ignoredDirectories.map(
            (directory) => `**/${directory}/**`,
          ),
          ...constants.ignoredFileExtensions.map(
            (extension) => `**/*.${extension}`,
          ),
        ],
      },
      (error, files) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      },
    );
  });

  const extensions: Set<string> = new Set();
  for (const file of files) {
    const extension = upath.extname(file);
    if (extension) {
      // Get rid of the leading . character.
      extensions.add(extension.replace(/^\./, ''));
    }
  }

  return [...extensions];
}

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Answers>} The answers from inquirer.
 */
async function askQuestion(globDirectory: string): Promise<Answers> {
  // We need to get a list of extensions corresponding to files in the directory
  // to use when asking the next question. That could potentially take some
  // time, so we show a spinner and explanatory text.
  const spinner = ora({
    text: `Examining files in ${globDirectory}...`,
    stream: process.stdout,
  }).start();
  const fileExtensions = await getAllFileExtensions(globDirectory);
  spinner.stop();

  assert(fileExtensions.length > 0, errors['no-file-extensions-found']);

  return prompt([
    {
      name,
      message: 'Which file types would you like to precache?',
      type: 'checkbox',
      choices: fileExtensions,
      default: fileExtensions,
    },
  ]);
}

export async function askExtensionsToCache(
  globDirectory: string,
): Promise<string[]> {
  const answers = await askQuestion(globDirectory);
  // The return value is an array of strings with the selected values
  // and there is a default, the casting is safe.
  const extensions: string[] = answers[name] as string[];
  assert(extensions.length > 0, errors['no-file-extensions-selected']);

  // glob isn't happy with a single option inside of a {} group, so use a
  // pattern without a {} group when there's only one extension.
  const extensionsPattern: string =
    extensions.length === 1 ? extensions[0] : `{${extensions.join(',')}}`;
  return [`**/*.${extensionsPattern}`];
}

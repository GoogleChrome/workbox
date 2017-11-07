/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const assert = require('assert');
const glob = require('glob');
const inquirer = require('inquirer');
const ora = require('ora');
const path = require('path');

const errors = require('../errors');
const {ignoredDirectories} = require('../constants');

// The key used for the question/answer.
const name = 'globPatterns';

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<[string]>} The unique file extensions corresponding to all
 * of the files under globDirectory.
 */
async function getAllFileExtensions(globDirectory) {
  const files = await new Promise((resolve, reject) => {
    // Use a pattern to match any file that contains a '.', since that signifies
    // the presence of a file extension.
    glob('**/*.*', {
      cwd: globDirectory,
      nodir: true,
      ignore: ignoredDirectories.map((directory) => `**/${directory}/**`),
    }, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });

  const extensions = new Set();
  for (const file of files) {
    const extension = path.extname(file);
    if (extension) {
      // Get rid of the leading . character.
      extensions.add(extension.replace(/^\./, ''));
    }
  }

  return [...extensions];
}

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Object>} The answers from inquirer.
 */
async function askQuestion(globDirectory) {
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

  return inquirer.prompt([{
    name,
    message: 'Which file types would you like to precache?',
    type: 'checkbox',
    choices: fileExtensions,
    default: fileExtensions,
  }]);
}

module.exports = async (globDirectory) => {
  const answers = await askQuestion(globDirectory);
  const extensions = answers[name];
  assert(extensions.length > 0, errors['no-file-extensions-selected']);

  // glob isn't happy with a single option inside of a {} group, so use a
  // pattern without a {} group when there's only one extension.
  const extensionsPattern = extensions.length === 1 ?
    extensions[0] :
    `{${extensions.join(',')}}`;
  return [`**/*.${extensionsPattern}`];
};

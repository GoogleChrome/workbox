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
const fse = require('fs-extra');
const glob = require('glob');
const inquirer = require('inquirer');
const ol = require('common-tags').oneLine;

const {ignoredDirectories} = require('../constants');
const errors = require('../errors');

const ROOT_PROMPT = 'Please enter the path to the root of your web app:';

// The key used for the question/answer.
const name = 'globDirectory';

/**
 * @return {Promise<Array<string>>} The subdirectories of the current
 * working directory, with hidden and ignored ones filtered out.
 */
async function getSubdirectories() {
  return await new Promise((resolve, reject) => {
    glob('*/', {
      ignore: ignoredDirectories.map((directory) => `${directory}/`),
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
    return inquirer.prompt([{
      name,
      type: 'list',
      message: ol`What is the root of your web app (i.e. which directory do
        you deploy)?`,
      choices: subdirectories.concat([
        new inquirer.Separator(),
        manualEntryChoice,
      ]),
    }, {
      name,
      when: (answers) => answers[name] === manualEntryChoice,
      message: ROOT_PROMPT,
    }]);
  } else {
    return inquirer.prompt([{
      name,
      message: ROOT_PROMPT,
      default: '.',
    }]);
  }
}

module.exports = async () => {
  const answers = await askQuestion();
  const globDirectory = answers[name];

  try {
    const stat = await fse.stat(globDirectory);
    assert(stat.isDirectory());
  } catch (error) {
    throw new Error(errors['glob-directory-invalid']);
  }

  return globDirectory;
};

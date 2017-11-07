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
const inquirer = require('inquirer');
const ol = require('common-tags').oneLine;

const errors = require('../errors');

// The key used for the question/answer.
const name = 'swDest';

/**
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion() {
  return inquirer.prompt([{
    name,
    message: ol`Where would you like your service worker file to be saved?`,
    type: 'input',
    default: 'build/sw.js',
  }]);
}

module.exports = async () => {
  const answers = await askQuestion();
  const swDest = answers[name].trim();

  assert(swDest, errors['invalid-sw-dest']);

  return swDest;
};

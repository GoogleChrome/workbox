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

const constants = require('../constants');
const errors = require('../errors');

// The key used for the question/answer.
const name = 'configLocation';

/**
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion() {
  return inquirer.prompt([{
    name,
    message: ol`Where would you like to save these configuration options?`,
    type: 'input',
    default: constants.defaultConfigFile,
  }]);
}

module.exports = async () => {
  const answers = await askQuestion();
  const configLocation = answers[name].trim();

  assert(configLocation, errors['invalid-config-location']);

  return configLocation;
};

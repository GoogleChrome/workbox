/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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

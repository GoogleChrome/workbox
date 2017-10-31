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

const inquirer = require('inquirer');
const fse = require('fs-extra');

const errors = require('../errors');

// The key used for the question/answer.
const name = 'swSrc';

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion() {
  return inquirer.prompt([{
    name,
    message: 'Do you...',
  }]);
}

module.exports = async () => {
  const swSrc = await askQuestion();

  if (swSrc) {
    const stat = await fse.stat(swSrc);
    if (!stat.isFile()) {
      throw new Error(errors['sw-src-does-not-exist']);
    }
  }

  return swSrc;
};


/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const inquirer = require('inquirer');
const ol = require('common-tags').oneLine;

const assertValidSwSrc = require('../assert-valid-sw-src');

// The key used for the question/answer.
const name = 'swSrc';

/**
 * @return {Promise<Object>} The answers from inquirer.
 */
function askQuestion() {
  return inquirer.prompt([{
    name,
    message: ol`Where's your existing service worker file? To be used with
      injectManifest, it should include a call to
      'workbox.precaching.precacheAndRoute([])'`,
    type: 'input',
  }]);
}

module.exports = async () => {
  const answers = await askQuestion();
  const swSrc = answers[name].trim();

  await assertValidSwSrc(swSrc);

  return swSrc;
};

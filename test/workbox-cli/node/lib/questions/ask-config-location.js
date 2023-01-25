/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {
  errors,
} = require('../../../../../packages/workbox-cli/build/lib/errors');

const MODULE_PATH =
  '../../../../../packages/workbox-cli/build/lib/questions/ask-config-location';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const QUESTION_NAME = 'configLocation';

describe(`[workbox-cli] lib/questions/ask-config-location.js`, function () {
  it(`should reject with a 'invalid-config-location' error when the answer is an empty string`, async function () {
    const {askConfigLocation} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: ''}),
      },
    });

    try {
      await askConfigLocation();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(errors['invalid-config-location']);
    }
  });

  it(`should resolve with the valid answer to the question`, async function () {
    const expectedAnswer = 'expected answer';
    const {askConfigLocation} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: expectedAnswer}),
      },
    });

    const answer = await askConfigLocation();
    expect(answer).to.eql(expectedAnswer);
  });
});

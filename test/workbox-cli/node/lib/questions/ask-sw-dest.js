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
  '../../../../../packages/workbox-cli/build/lib/questions/ask-sw-dest';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const QUESTION_NAME = 'swDest';

describe(`[workbox-cli] lib/questions/ask-sw-dest.js`, function () {
  it(`should reject with a 'invalid-sw-dest' error when the answer is empty`, async function () {
    const {askSWDest} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: ''}),
      },
    });

    try {
      await askSWDest();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(errors['invalid-sw-dest']);
    }
  });

  it(`should reject with a valid answer to the question`, async function () {
    const expectedAnswer = 'expected answer';
    const {askSWDest} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: expectedAnswer}),
      },
    });

    const answer = await askSWDest();
    expect(answer).to.eql(expectedAnswer);
  });
});

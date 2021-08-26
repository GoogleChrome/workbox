/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const MODULE_PATH =
  '../../../../../packages/workbox-cli/build/lib/questions/ask-sw-src';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const QUESTION_NAME = 'swSrc';

describe(`[workbox-cli] lib/questions/ask-sw-src.js`, function () {
  it(`should resolve with a valid answer to the question`, async function () {
    const expectedAnswer = 'expected answer';
    const {askSWSrc} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: expectedAnswer}),
      },
    });

    const answer = await askSWSrc();
    expect(answer).to.eql(expectedAnswer);
  });
});

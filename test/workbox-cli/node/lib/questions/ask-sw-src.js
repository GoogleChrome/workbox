const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const MODULE_PATH = '../../../../../packages/workbox-cli/src/lib/questions/ask-sw-src';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const QUESTION_NAME = 'swSrc';

describe(`[workbox-cli] lib/questions/ask-sw-src.js`, function() {
  it(`should reject when the valid SW assertion fails`, async function() {
    const injectedError = new Error('injected error');
    const askSWSrc = proxyquire(MODULE_PATH, {
      'inquirer': {
        prompt: () => Promise.resolve({[QUESTION_NAME]: ''}),
      },
      '../assert-valid-sw-src': () => Promise.reject(injectedError),
    });

    try {
      await askSWSrc();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error).to.eql(injectedError);
    }
  });

  it(`should resolve with a valid answer to the question`, async function() {
    const expectedAnswer = 'expected answer';
    const askSWSrc = proxyquire(MODULE_PATH, {
      'inquirer': {
        prompt: () => Promise.resolve({[QUESTION_NAME]: expectedAnswer}),
      },
      '../assert-valid-sw-src': () => Promise.resolve(),
    });

    const answer = await askSWSrc();
    expect(answer).to.eql(expectedAnswer);
  });
});


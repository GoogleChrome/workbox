/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {errors} = require('../../../../../packages/workbox-cli/build/lib/errors');

const MODULE_PATH = '../../../../../packages/workbox-cli/build/lib/questions/ask-root-of-web-app';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const QUESTION_NAME = 'globDirectory';
const DIRECTORY = '/path/to/directory';

describe(`[workbox-cli] lib/questions/ask-root-of-web-app.js`, function() {
  it(`should reject with a 'glob-directory-invalid' error when the answer isn't a valid directory`, async function() {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () => Promise.resolve({[QUESTION_NAME]: DIRECTORY}),
      },
      'fs-extra': {
        stat: (path) => {
          return {
            isDirectory: () => {
              // This will return false when our injected DIRECTORY value is
              // passed in.
              return path !== DIRECTORY;
            },
          };
        },
      },
    });

    try {
      await askRootOfWebApp();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(errors['glob-directory-invalid']);
    }
  });

  it(`should resolve with a valid answer to the question`, async function() {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () => Promise.resolve({[QUESTION_NAME]: DIRECTORY}),
      },
      'fs-extra': {
        stat: (path) => {
          return {
            isDirectory: () => {
              // This will return true when our injected DIRECTORY value is
              // passed in.
              return path === DIRECTORY;
            },
          };
        },
      },
    });

    const answer = await askRootOfWebApp();
    expect(answer).to.eql(DIRECTORY);
  });
});


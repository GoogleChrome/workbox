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
  '../../../../../packages/workbox-cli/build/lib/questions/ask-root-of-web-app';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const questionRootDirectory = 'globDirectory';
const questionManualInput = 'manualDirectoryInput';
const DIRECTORY = '/path/to/directory';
const CHILD_DIRECTORY = '/path/to/directory/child';
const CHILD_DIRECTORY_WHITE_SPACE = '/path/to/directory/   child';
const CHILD_DIRECTORY_BLANK = '  ';

describe(`[workbox-cli] lib/questions/ask-root-of-web-app.js`, function () {
  it(`should reject with a 'glob-directory-invalid' error when the answer isn't a valid directory`, async function () {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () => Promise.resolve({[questionRootDirectory]: DIRECTORY}),
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

  it(`should reject with a 'glob-directory-invalid' error when the manual input is provided (directory does not exist)`, async function () {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () =>
          Promise.resolve({
            [questionRootDirectory]: DIRECTORY,
            [questionManualInput]: CHILD_DIRECTORY,
          }),
      },
      'fs-extra': {
        stat: (path) => {
          return {
            isDirectory: () => {
              return path !== CHILD_DIRECTORY;
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

  it(`should resolve with a valid answer to the question when no child directories are present (default: use current directory)`, async function () {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () => Promise.resolve({[questionRootDirectory]: DIRECTORY}),
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

  it(`should resolve with a valid answer to the question when manual input is provided (directory exists)`, async function () {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () =>
          Promise.resolve({
            [questionRootDirectory]: DIRECTORY,
            [questionManualInput]: CHILD_DIRECTORY,
          }),
      },
      'fs-extra': {
        stat: (path) => {
          return {
            isDirectory: () => {
              return path === CHILD_DIRECTORY;
            },
          };
        },
      },
    });

    const answer = await askRootOfWebApp();
    expect(answer).to.eql(CHILD_DIRECTORY);
  });

  it(`should resolve with a valid answer to the question when manual input is provided (directory exists and name contains white space)`, async function () {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () =>
          Promise.resolve({
            [questionRootDirectory]: DIRECTORY,
            [questionManualInput]: CHILD_DIRECTORY_WHITE_SPACE,
          }),
      },
      'fs-extra': {
        stat: (path) => {
          return {
            isDirectory: () => {
              return path === CHILD_DIRECTORY_WHITE_SPACE;
            },
          };
        },
      },
    });

    const answer = await askRootOfWebApp();
    expect(answer).to.eql(CHILD_DIRECTORY_WHITE_SPACE);
  });

  it(`should resolve with a valid answer to the question when manual input is provided (directory exists and name is composed of only white space)`, async function () {
    const {askRootOfWebApp} = proxyquire(MODULE_PATH, {
      'glob': (pattern, config, callback) => {
        callback(null, []);
      },
      'inquirer': {
        prompt: () =>
          Promise.resolve({
            [questionRootDirectory]: DIRECTORY,
            [questionManualInput]: CHILD_DIRECTORY_BLANK,
          }),
      },
      'fs-extra': {
        stat: (path) => {
          return {
            isDirectory: () => {
              return path === CHILD_DIRECTORY_BLANK;
            },
          };
        },
      },
    });

    const answer = await askRootOfWebApp();
    expect(answer).to.eql(CHILD_DIRECTORY_BLANK);
  });
});

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
  '../../../../../packages/workbox-cli/build/lib/questions/ask-extensions-to-cache';
// This is the hardcoded name of the question that's passed to inquirer.
// It's used as the key to read the response from the answer.
const QUESTION_NAME = 'globPatterns';
const GLOB_DIRECTORY = '/path/to/fake';
const SINGLE_EXTENSION = 'js';
const MULTIPLE_EXTENSIONS = ['html', 'js'];

describe(`[workbox-cli] lib/questions/ask-extensions-to-cache.js`, function () {
  it(`should reject with a 'no-file-extensions-found' error when the globDirectory doesn't contain any matching files`, async function () {
    const {askExtensionsToCache} = proxyquire(MODULE_PATH, {
      glob: (pattern, config, callback) => {
        callback(null, []);
      },
      ora: () => {
        return {
          start: () => {
            return {stop: () => {}};
          },
        };
      },
    });

    try {
      await askExtensionsToCache(GLOB_DIRECTORY);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(errors['no-file-extensions-found']);
    }
  });

  it(`should reject with a 'no-file-extensions-selected' error when the answer is an empty array`, async function () {
    const {askExtensionsToCache} = proxyquire(MODULE_PATH, {
      glob: (pattern, config, callback) => {
        callback(null, [`file.${SINGLE_EXTENSION}`]);
      },
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: []}),
      },
      ora: () => {
        return {
          start: () => {
            return {stop: () => {}};
          },
        };
      },
    });

    try {
      await askExtensionsToCache(GLOB_DIRECTORY);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(errors['no-file-extensions-selected']);
    }
  });

  it(`should resolve with the expected value when the answer is a single extension`, async function () {
    const {askExtensionsToCache} = proxyquire(MODULE_PATH, {
      glob: (pattern, config, callback) => {
        callback(null, [`file.${SINGLE_EXTENSION}`]);
      },
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: [SINGLE_EXTENSION]}),
      },
      ora: () => {
        return {
          start: () => {
            return {stop: () => {}};
          },
        };
      },
    });

    const answer = await askExtensionsToCache(GLOB_DIRECTORY);
    expect(answer).to.eql([`**/*.${SINGLE_EXTENSION}`]);
  });

  it(`should resolve with the expected value when the answer is multiple extensions`, async function () {
    const {askExtensionsToCache} = proxyquire(MODULE_PATH, {
      glob: (pattern, config, callback) => {
        callback(
          null,
          MULTIPLE_EXTENSIONS.map((extension) => `file.${extension}`),
        );
      },
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: MULTIPLE_EXTENSIONS}),
      },
      ora: () => {
        return {
          start: () => {
            return {stop: () => {}};
          },
        };
      },
    });

    const answer = await askExtensionsToCache(GLOB_DIRECTORY);
    expect(answer).to.eql([`**/*.{${MULTIPLE_EXTENSIONS.join(',')}}`]);
  });

  it(`should ignore the expected directories and extensions`, async function () {
    const {askExtensionsToCache} = proxyquire(MODULE_PATH, {
      glob: (pattern, config, callback) => {
        expect(config.ignore).to.eql(['**/node_modules/**', '**/*.map']);
        callback(
          null,
          MULTIPLE_EXTENSIONS.map((extension) => `file.${extension}`),
        );
      },
      inquirer: {
        prompt: () => Promise.resolve({[QUESTION_NAME]: MULTIPLE_EXTENSIONS}),
      },
      ora: () => {
        return {
          start: () => {
            return {stop: () => {}};
          },
        };
      },
    });

    await askExtensionsToCache(GLOB_DIRECTORY);
  });
});

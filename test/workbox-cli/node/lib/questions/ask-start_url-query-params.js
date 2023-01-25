/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {
  errors,
} = require('../../../../../packages/workbox-cli/build/lib/errors');
const {
  constants,
} = require('../../../../../packages/workbox-cli/build/lib/constants');

const MODULE_PATH =
  '../../../../../packages/workbox-cli/build/lib/questions/ask-start_url-query-params';

// These are the hardcoded names of the question that are passed to inquirer.
// They are used as the keys to read the response from the users answers.
const question_ignoreURLParametersMatching = 'ignoreURLParametersMatching';
const question_shouldAskForIgnoreURLParametersMatching =
  'shouldAskForIgnoreURLParametersMatching';

const DEFAULT_IGNORED_URL_PARAMETERS = constants.ignoreURLParametersMatching;

//  Helper method for creating RegExp from dynamic values.
const toRegex = (searchParam) => new RegExp(`^${searchParam}`);

describe(`[workbox-cli] lib/questions/ask-start_url-query-params.js`, function () {
  it(`should resolve with a default search parameters if answered no to the question`, async function () {
    const shouldAskForIgnoreURLParametersMatching = false;
    const {askQueryParametersInStartUrl} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () =>
          Promise.resolve({
            [question_shouldAskForIgnoreURLParametersMatching]:
              shouldAskForIgnoreURLParametersMatching,
          }),
      },
    });

    const answer = await askQueryParametersInStartUrl();
    expect(answer).to.eql(DEFAULT_IGNORED_URL_PARAMETERS);
  });

  it(`should throw 'no-search-parameters-supplied' if answered yes and no url search parameters are passed`, async function () {
    const shouldAskForIgnoreURLParametersMatching = true;
    const {askQueryParametersInStartUrl} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () =>
          Promise.resolve({
            [question_shouldAskForIgnoreURLParametersMatching]:
              shouldAskForIgnoreURLParametersMatching,
          }),
      },
    });

    try {
      await askQueryParametersInStartUrl();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(errors['no-search-parameters-supplied']);
    }
  });

  it(`should throw 'invalid-search-parameters-supplied' if url search parameter passed is prefixed with '?' or '/'`, async function () {
    const shouldAskForIgnoreURLParametersMatching = true;
    const ignoreURLParametersMatching = '?source';
    const {askQueryParametersInStartUrl} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () =>
          Promise.resolve({
            [question_shouldAskForIgnoreURLParametersMatching]:
              shouldAskForIgnoreURLParametersMatching,
            [question_ignoreURLParametersMatching]: ignoreURLParametersMatching,
          }),
      },
    });

    try {
      await askQueryParametersInStartUrl();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(
        errors['invalid-search-parameters-supplied'],
      );
    }
  });

  it(`should throw 'invalid-search-parameters-supplied' if one of the provided url search parameters is prefixed with '?' or '/'`, async function () {
    const shouldAskForIgnoreURLParametersMatching = true;
    const ignoreURLParametersMatching = 'search,version,?language';
    const {askQueryParametersInStartUrl} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () =>
          Promise.resolve({
            [question_shouldAskForIgnoreURLParametersMatching]:
              shouldAskForIgnoreURLParametersMatching,
            [question_ignoreURLParametersMatching]: ignoreURLParametersMatching,
          }),
      },
    });

    try {
      await askQueryParametersInStartUrl();
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.eql(
        errors['invalid-search-parameters-supplied'],
      );
    }
  });

  it(`should resolve with a list of search parameters when a valid url search parameter is passed`, async function () {
    const shouldAskForIgnoreURLParametersMatching = true;
    const ignoreURLParametersMatching = 'search';
    const expectedAnswer = DEFAULT_IGNORED_URL_PARAMETERS.concat(
      toRegex(ignoreURLParametersMatching),
    );
    const {askQueryParametersInStartUrl} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () =>
          Promise.resolve({
            [question_shouldAskForIgnoreURLParametersMatching]:
              shouldAskForIgnoreURLParametersMatching,
            [question_ignoreURLParametersMatching]: ignoreURLParametersMatching,
          }),
      },
    });

    const answer = await askQueryParametersInStartUrl();
    expect(answer).to.eql(expectedAnswer);
  });

  it(`should resolve with a list of search parameters when a valid list of url search parameters is passed`, async function () {
    const shouldAskForIgnoreURLParametersMatching = true;
    const ignoreURLParametersMatching = 'search,version,language';
    const expectedAnswer = DEFAULT_IGNORED_URL_PARAMETERS.concat(
      ignoreURLParametersMatching.split(',').map(toRegex),
    );
    const {askQueryParametersInStartUrl} = proxyquire(MODULE_PATH, {
      inquirer: {
        prompt: () =>
          Promise.resolve({
            [question_shouldAskForIgnoreURLParametersMatching]:
              shouldAskForIgnoreURLParametersMatching,
            [question_ignoreURLParametersMatching]: ignoreURLParametersMatching,
          }),
      },
    });

    const answer = await askQueryParametersInStartUrl();
    expect(answer).to.eql(expectedAnswer);
  });
});

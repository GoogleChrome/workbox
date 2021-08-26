/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

class AJVFailsValidation {
  compile() {
    const stub = sinon.stub().returns(false);
    stub.errors = [];
    return stub;
  }
  addKeyword() {
    // no-op
  }
}

class AJVPassesValidation {
  compile() {
    return sinon.stub().returns(true);
  }
  addKeyword() {
    // no-op
  }
}

// The integration tests will exercise the actual validation logic.
describe(`[workbox-build] entry-points/options/validate-options.js`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/validate-options';
  const testCases = [
    'validateGenerateSWOptions',
    'validateGetManifestOptions',
    'validateInjectManifestOptions',
  ];

  for (const func of testCases) {
    it(`${func}() should throw when validation fails`, function () {
      const validateOptions = proxyquire(MODULE_PATH, {
        'ajv': {
          default: AJVFailsValidation,
        },
        '@apideck/better-ajv-errors': {
          betterAjvErrors: sinon.stub().returns([
            {
              message: 'message1',
              path: 'path1',
              suggestion: 'suggestion1',
            },
            {
              message: 'message2',
              path: 'path2',
              suggestion: 'suggestion2',
            },
          ]),
        },
      });

      expect(() => validateOptions[func]()).to.throw(
        validateOptions.WorkboxConfigError,
        `[path1] message1. suggestion1\n\n[path2] message2. suggestion2`,
      );
    });

    it(`${func}() should not throw when validation passes`, function () {
      const validateOptions = proxyquire(MODULE_PATH, {
        ajv: {
          default: AJVPassesValidation,
        },
      });

      const defaultOptions = validateOptions[func]({
        globDirectory: '.',
      });
      expect(defaultOptions).to.be.an('object');
    });
  }
});

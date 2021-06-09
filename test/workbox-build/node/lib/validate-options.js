/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const INJECTED_ERROR = 'Injected error.';
class AJVFailsValidation {
  compile() {
    const stub = sinon.stub().returns(false);
    stub.errors = [INJECTED_ERROR];
    return stub;
  }
}

class AJVPassesValidation {
  compile() {
    return sinon.stub().returns(true);
  }
}

// The integration tests will exercise the actual validation logic.
describe(`[workbox-build] entry-points/options/validate-options.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/build/lib/validate-options';
  const testCases = [
    'validateGenerateSWOptions',
    'validateGetManifestOptions',
    'validateInjectManifestOptions',
  ];

  for (const func of testCases) {
    it(`${func}() should throw when validation fails`, function() {
      const validateOptions = proxyquire(MODULE_PATH, {
        'ajv': {
          default: AJVFailsValidation,
        },
      });
  
      expect(() => validateOptions[func]()).to.throw(INJECTED_ERROR);
    });
  
    it(`${func}() should not throw when validation passes`, function() {
      const validateOptions = proxyquire(MODULE_PATH, {
        'ajv': {
          default: AJVPassesValidation,
        },
      });
  
      const defaultOptions = validateOptions[func]({});
      expect(defaultOptions).to.be.an('object');
    });
  }
});

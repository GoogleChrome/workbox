/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

// The integration tests will exercise the actual validation logic.
describe(`[workbox-build] entry-points/options/validate-options.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/build/lib/validate-options';
  const testCases = new Map([
    ['validateGenerateSWOptions', 'isGenerateSWOptions'],
    ['validateGetManifestOptions', 'isGetManifestOptions'],
    ['validateInjectManifestOptions', 'isInjectManifestOptions'],
  ]);

  for (const [func, guardFunc] of testCases) {
    it.skip(`${func}() should throw when ${guardFunc}() returns false`, function() {
      const validateOptions = proxyquire(MODULE_PATH, {
        '../types.guard': {
          [guardFunc]: () => false,
        },
      });
  
      expect(() => validateOptions[func]()).to.throw('Validation failed.');
    });
  
    it.skip(`${func}() should return options with defaults when ${guardFunc}() returns true`, function() {
      const validateOptions = proxyquire(MODULE_PATH, {
        '../types.guard': {
          [guardFunc]: () => true,
        },
      });
  
      const defaultOptions = validateOptions[func]();
      expect(defaultOptions).to.be.an('object');
    });
  }
});

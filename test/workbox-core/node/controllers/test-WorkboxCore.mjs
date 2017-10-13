import {expect} from 'chai';

import expectError from '../../../../infra/testing/expectError';
import generateVariantTests from '../../../../infra/testing/generate-variant-tests';
import {devOnly, prodOnly} from '../../../../infra/testing/env-it.js';
import constants from '../../../../gulp-tasks/utils/constants.js';
import core from '../../../../packages/workbox-core/index.mjs';
import * as coreModule from '../../../../packages/workbox-core/index.mjs';

describe(`workbox-core WorkboxCore`, function() {
  describe(`core.assert.*`, function() {
    devOnly.it(`should expose assert in dev`, async function() {
      expect(core.assert).to.exist;
    });

    prodOnly.it(`should NOT expose assert in prod build`, async function() {
      expect(core.assert).to.not.exist;
    });
  });

  describe(`core.logLevel (getter)`, function() {
    devOnly.it(`should initialise to 'log' log level in dev`, function() {
      expect(core.logLevel).to.equal(coreModule.LOG_LEVELS.log);
    });

    prodOnly.it(`should initialise to 'warn' log level in prod`, function() {
      expect(core.logLevel).to.equal(coreModule.LOG_LEVELS.warn);
    });
  });

  describe(`core.setLogLevel`, function() {
    it(`should allow valid log levels`, function() {
      expect(() => {
        const logLevelNames = Object.keys(coreModule.LOG_LEVELS);
        logLevelNames.forEach((logLevelName) => {
          core.setLogLevel(coreModule.LOG_LEVELS[logLevelName]);
        });
      }).to.not.throw();
    });

    it(`should not allow log level less than log`, function() {
      return expectError(() => {
        core.setLogLevel(coreModule.LOG_LEVELS.log - 1);
      }, 'invalid-value');
    });

    it(`should not allow log level greater than silent`, function() {
      return expectError(() => {
        core.setLogLevel(coreModule.LOG_LEVELS.silent + 1);
      }, 'invalid-value');
    });

    generateVariantTests(`should not allow non-number log levels`, [
      undefined,
      null,
      '',
      [],
      {},
    ], function(variant) {
      if (process.env.NODE_ENV !== constants.BUILD_TYPES.dev) {
        return this.skip();
      }

      return expectError(() => {
        core.setLogLevel(variant);
      }, 'incorrect-type');
    });
  });

  describe('core.cacheNames', function() {
    afterEach(function() {
      // TODO(gauntface): there should be a way to get access to the current
      // (or default) prefix and suffix values so they can be restored here.
      core.setCacheNameDetails({
        prefix: 'workbox',
        suffix: self.registration.scope,
        precache: 'precache',
        runtime: 'runtime',
      });
    });

    it('should return expected defaults', function() {
      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`workbox-runtime-/`);
    });

    it('should allow customising the prefix', function() {
      core.setCacheNameDetails({prefix: 'test-prefix'});

      // Scope by default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`test-prefix-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`test-prefix-runtime-/`);
    });

    it('should allow customising the suffic', function() {
      core.setCacheNameDetails({suffix: 'test-suffix'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-precache-test-suffix`);
      expect(core.cacheNames.runtime).to.equal(`workbox-runtime-test-suffix`);
    });


    it('should allow customising the precache name', function() {
      core.setCacheNameDetails({precache: 'test-precache'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-test-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`workbox-runtime-/`);
    });

    it('should allow customising the precache name', function() {
      core.setCacheNameDetails({runtime: 'test-runtime'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`workbox-test-runtime-/`);
    });

    it('should allow customising all', function() {
      core.setCacheNameDetails({
        prefix: 'test-prefix',
        suffix: 'test-suffix',
        precache: 'test-precache',
        runtime: 'test-runtime',
      });

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`test-prefix-test-precache-test-suffix`);
      expect(core.cacheNames.runtime).to.equal(`test-prefix-test-runtime-test-suffix`);
    });

    it('should allow setting prefix and suffix to empty string', function() {
      core.setCacheNameDetails({
        prefix: '',
        suffix: '',
        precache: 'test-precache',
        runtime: 'test-runtime',
      });

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`test-precache`);
      expect(core.cacheNames.runtime).to.equal(`test-runtime`);
    });

    devOnly.it('should not allow precache to be an empty string in dev', function() {
      return expectError(() => {
        core.setCacheNameDetails({
          precache: '',
        });
      }, 'invalid-cache-name');
    });


    devOnly.it('should not allow runtime to be an empty string in dev', function() {
      return expectError(() => {
        core.setCacheNameDetails({
          runtime: '',
        });
      }, 'invalid-cache-name');
    });

    const badValues = [
      undefined,
      null,
      {},
      [],
      true,
      false,
    ];
    generateVariantTests(`should handle bad prefix values in dev`, badValues, function(variant) {
      if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) return this.skip();

      return expectError(() => {
        core.setCacheNameDetails({
          prefix: variant,
        });
      }, 'incorrect-type');
    });

    generateVariantTests(`should handle bad suffix values in dev`, badValues, function(variant) {
      if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) return this.skip();

      return expectError(() => {
        core.setCacheNameDetails({
          suffix: variant,
        });
      }, 'incorrect-type');
    });

    generateVariantTests(`should handle bad precache values in dev`, badValues, function(variant) {
      if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) return this.skip();

      return expectError(() => {
        core.setCacheNameDetails({
          precache: variant,
        });
      }, 'incorrect-type');
    });

    generateVariantTests(`should handle bad runtime values in dev`, badValues, function(variant) {
      if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) return this.skip();

      return expectError(() => {
        core.setCacheNameDetails({
          runtime: variant,
        });
      }, 'incorrect-type');
    });

    generateVariantTests(`should not throw in prod`, badValues, function(variant) {
      if (process.env.NODE_ENV !== constants.BUILD_TYPES.prod) return this.skip();

      core.setCacheNameDetails({
        prefix: variant,
        suffix: variant,
        precache: variant,
        runtime: variant,
      });
    });
  });
});

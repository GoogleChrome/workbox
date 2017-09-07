import {expect} from 'chai';
import clearRequire from 'clear-require';

import expectError from '../../../../infra/utils/expectError';
import constants from '../../../../gulp-tasks/utils/constants.js';
import generateVariantTests from '../../../../infra/utils/generate-variant-tests';
import WorkboxError from '../../../../packages/workbox-core/models/WorkboxError.mjs';

describe(`WorkboxCore`, function() {
  beforeEach(function() {
    clearRequire.all();
  });

  describe(`core.assert.*`, function() {
    it(`should expose assert in dev build`, async function() {
      process.env.NODE_ENV = 'dev';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(core.assert).to.exist;
    });

    it(`should NOT expose assert in prod build`, async function() {
      process.env.NODE_ENV = 'prod';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(core.assert).to.not.exist;
    });
  });

  describe(`core.logLevel (getter)`, function() {
    it(`should initialise to 'verbose' log level for dev build`, async function() {
      process.env.NODE_ENV = 'dev';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      expect(core.logLevel).to.equal(coreModule.LOG_LEVELS.verbose);
    });

    it(`should initialise to 'warn' log level for prod build`, async function() {
      process.env.NODE_ENV = 'prod';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      expect(core.logLevel).to.equal(coreModule.LOG_LEVELS.warn);
    });
  });

  describe(`core.logLevel (set)`, function() {
    it(`should allow valid log levels`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(() => {
        const logLevelNames = Object.keys(coreModule.LOG_LEVELS);
        logLevelNames.forEach((logLevelName) => {
          core.logLevel = coreModule.LOG_LEVELS[logLevelName];
        });
      }).to.not.throw();
    });

    it(`should not allow log level less than verbose`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.logLevel = coreModule.LOG_LEVELS.verbose - 1;
      }, 'invalid-value');
    });

    it(`should not allow log level greater than silent`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.logLevel = coreModule.LOG_LEVELS.silent + 1;
      }, 'invalid-value');
    });

    generateVariantTests(`should not allow non-number log levels`, [
      undefined,
      null,
      '',
      [],
      {},
    ], async (variant) => {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.logLevel = variant;
      }, 'invalid-type');
    });
  });
});

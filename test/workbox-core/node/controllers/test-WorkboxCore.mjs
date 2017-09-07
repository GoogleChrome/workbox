import {expect} from 'chai';
import clearRequire from 'clear-require';

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

  describe(`import {LOG_LEVELS} from 'workbox-core';`, function() {
    it(`should expose the valid LOG_LEVELS`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      expect(coreModule.LOG_LEVELS).to.exist;
    });

    it(`should expose the expected LOG_LEVELS`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      expect(coreModule.LOG_LEVELS.verbose).to.exist;
      expect(coreModule.LOG_LEVELS.debug).to.exist;
      expect(coreModule.LOG_LEVELS.warn).to.exist;
      expect(coreModule.LOG_LEVELS.error).to.exist;
    });
  });

  describe(`core.logLevel (get)`, function() {
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
    /** it(`should allow valid log levels`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(() => {
        core.logLevel = coreModule.LOG_LEVELS.verbose;
        core.logLevel = coreModule.LOG_LEVELS.debug;
        core.logLevel = coreModule.LOG_LEVELS.warn;
        core.logLevel = coreModule.LOG_LEVELS.error;
      }).to.not.throw();
    });

    it(`should not allow log level less than verbose`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(() => {
        core.logLevel = coreModule.LOG_LEVELS.verbose - 1;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-value');
    });

    it(`should not allow log level greater than error`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(() => {
        core.logLevel = coreModule.LOG_LEVELS.error + 1;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-value');
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

      expect(() => {
        core.logLevel = variant;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-type');
    });**/
  });
});

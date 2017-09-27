import {expect} from 'chai';
import clearRequire from 'clear-require';
import makeServiceWorkerEnv from 'service-worker-mock';

import expectError from '../../../../infra/utils/expectError';
import generateVariantTests from '../../../../infra/utils/generate-variant-tests';

describe(`workbox-core WorkboxCore`, function() {
  before(function() {
    const swEnv = makeServiceWorkerEnv();
    Object.assign(global, swEnv);
  });

  beforeEach(function() {
    clearRequire.all();
    process.env.NODE_ENV = 'dev';
  });

  describe(`core.assert.*`, function() {
    it(`should expose assert in dev build`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(core.assert).to.exist;
    });

    it(`should NOT expose assert in prod build`, async function() {
      process.env.NODE_ENV = 'production';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(core.assert).to.not.exist;
    });
  });

  describe(`core.logLevel (getter)`, function() {
    it(`should initialise to 'verbose' log level for dev build`, async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      expect(core.logLevel).to.equal(coreModule.LOG_LEVELS.verbose);
    });

    it(`should initialise to 'warn' log level for production build`, async function() {
      process.env.NODE_ENV = 'production';

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

  describe('core.cacheNames', function() {
    it('should return expected defaults', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`workbox-runtime-/`);
    });

    it('should allow customising the prefix', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      core.setCacheNameDetails({prefix: 'test-prefix'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`test-prefix-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`test-prefix-runtime-/`);
    });

    it('should allow customising the suffic', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      core.setCacheNameDetails({suffix: 'test-suffix'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-precache-test-suffix`);
      expect(core.cacheNames.runtime).to.equal(`workbox-runtime-test-suffix`);
    });

    it('should allow customising the precache name', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      core.setCacheNameDetails({precache: 'test-precache'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-test-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`workbox-runtime-/`);
    });

    it('should allow customising the precache name', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      core.setCacheNameDetails({runtime: 'test-runtime'});

      // Scope be default is '/' from 'service-worker-mock'
      expect(core.cacheNames.precache).to.equal(`workbox-precache-/`);
      expect(core.cacheNames.runtime).to.equal(`workbox-test-runtime-/`);
    });

    it('should allow customising all', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
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

    it('should allow setting prefix and suffix to empty string', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
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

    it('should not allow precache to be an empty string', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
      return expectError(() => {
        core.setCacheNameDetails({
          precache: '',
        });
      }, 'invalid-cache-name');
    });

    it('should not allow runtime to be an empty string', async function() {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;
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
    generateVariantTests(`should handle bad prefix values`, badValues, async (variant) => {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.setCacheNameDetails({
        prefix: variant,
      });
      }, 'invalid-type');
    });

    generateVariantTests(`should handle bad suffix values`, badValues, async (variant) => {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.setCacheNameDetails({
          suffix: variant,
        });
      }, 'invalid-type');
    });

    generateVariantTests(`should handle bad precache values`, badValues, async (variant) => {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.setCacheNameDetails({
          precache: variant,
        });
      }, 'invalid-type');
    });

    generateVariantTests(`should handle bad runtime values`, badValues, async (variant) => {
      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      return expectError(() => {
        core.setCacheNameDetails({
          runtime: variant,
        });
      }, 'invalid-type');
    });

    generateVariantTests(`should not throw on production builds`, badValues, async (variant) => {
      process.env.NODE_ENV = 'production';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      core.setCacheNameDetails({
        prefix: variant,
        suffix: variant,
        precache: variant,
        runtime: variant,
      });
    });
  });
});

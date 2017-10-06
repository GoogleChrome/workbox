import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';
import expectError from '../../../infra/testing/expectError';

describe(`[workbox-precaching] WorkboxPrecaching`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function() {
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`Used in a window`, function() {
    it(`should throw when loaded outside of a service worker in dev`, async function() {
      if (process.env.NODE_ENV == 'production') return this.skip();

      return expectError(async () => {
        await import('../../../packages/workbox-precaching/index.mjs');
      }, 'not-in-sw', (err) => {
        expect(err.details).to.have.property('moduleName').that.equal('workbox-precaching');
      });
    });

    it(`should not throw when in SW in dev`, async function() {
      if (process.env.NODE_ENV == 'production') return this.skip();

      const coreModule = await import('../../../packages/workbox-core/index.mjs');
      sandbox.stub(coreModule.default.assert, 'isSwEnv').callsFake(() => true);

      await import('../../../packages/workbox-precaching/index.mjs');
    });

    it(`should not throw in production`, async function() {
      if (process.env.NODE_ENV != 'production') return this.skip();

      await import('../../../packages/workbox-precaching/index.mjs');
    });
  });
});

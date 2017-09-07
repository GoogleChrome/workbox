import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';

import constants from '../../../gulp-tasks/utils/constants.js';

describe(`WorkboxPrecaching`, function() {
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
    it(`should throw in dev builds when loaded outside of a service worker`, async function() {
      process.env.NODE_ENV = 'dev';

      try {
        await import('../../../packages/workbox-precaching/index.mjs');
        throw new Error('Expected error to be thrown in dev builds.');
      } catch (err) {
        expect(err.constructor.name).to.equal('WorkboxError');
        expect(err).to.have.property('name').that.equal('not-in-sw');
        expect(err.details).to.have.property('moduleName').that.equal('workbox-precaching');
      }
    });

    it(`should not throw in dev builds when in SW`, async function() {
      process.env.NODE_ENV = 'dev';

      const coreModule = await import('../../../packages/workbox-core/index.mjs');
      sandbox.stub(coreModule.default.assert, 'isSWEnv').callsFake(() => true);

      await import('../../../packages/workbox-precaching/index.mjs');
    });

    it(`should not throw in prod builds`, async function() {
      process.env.NODE_ENV = 'prod';

      await import('../../../packages/workbox-precaching/index.mjs')
    });
  });
});

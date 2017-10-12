import clearRequire from 'clear-require';
import sinon from 'sinon';
import {expect} from 'chai';

import expectError from '../../../infra/testing/expectError';

describe(`[workbox-routing] SW environment`, function() {
  const MODULE_PATH = '../../../packages/workbox-routing/index.mjs';
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it(`should throw when loaded outside of a service worker in dev`, async function() {
    if (process.env.NODE_ENV === 'production') return this.skip();

    class Foo {}
    sandbox.stub(global, 'ServiceWorkerGlobalScope').value(Foo);

    await expectError(async () => {
      await import(MODULE_PATH);
    }, 'not-in-sw', (err) => {
      expect(err.details).to.have.property('moduleName').that.equal('workbox-routing');
    });
  });

  it(`should not throw when in SW in dev`, async function() {
    if (process.env.NODE_ENV === 'production') return this.skip();

    const coreModule = await import('../../../packages/workbox-core/index.mjs');
    sandbox.stub(coreModule.default.assert, 'isSwEnv').callsFake(() => true);

    await import(MODULE_PATH);
  });

  it(`should not throw in production`, async function() {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    await import(MODULE_PATH);
  });
});

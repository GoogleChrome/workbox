import clearRequire from 'clear-require';
import makeServiceWorkerEnv from 'service-worker-mock';
import sinon from 'sinon';
import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError';

describe(`workbox-routing: SW environment`, function() {
  const sandbox = sinon.sandbox.create();
  const initialNodeEnv = process.env.NODE_ENV;

  before(function() {
    Object.assign(global, makeServiceWorkerEnv());
  });

  beforeEach(function() {
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
    process.env.NODE_ENV = initialNodeEnv;
  });

  it(`should throw in dev builds when loaded outside of a service worker`, async function() {
    process.env.NODE_ENV = 'dev';

    return expectError(
      async () => await import('../../../packages/workbox-routing/index.mjs'),
      'not-in-sw',
      (error) => expect(error.details).to.have.property('moduleName').that.equals('workbox-routing')
    );
  });

  it(`should not throw in dev builds when loaded in a service worker`, async function() {
    process.env.NODE_ENV = 'dev';

    const core = await import('../../../packages/workbox-core/index.mjs');
    sandbox.stub(core.default.assert, 'isSwEnv').callsFake(() => true);

    await import('../../../packages/workbox-routing/index.mjs');
  });

  it(`should not throw in production builds when loaded outside of a service worker`, async function() {
    process.env.NODE_ENV = 'production';

    await import('../../../packages/workbox-routing/index.mjs');
  });
});

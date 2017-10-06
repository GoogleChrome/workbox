import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';
import expectError from '../../../infra/testing/expectError';

describe(`workbox-routing: SW environment`, function() {
  const sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
    clearRequire.all();
  });

  it(`should throw when loaded outside of a service worker in dev`, function() {
    if (process.env.NODE_ENV == 'production') return this.skip();

    return expectError(
      async () => await import('../../../packages/workbox-routing/index.mjs'),
      'not-in-sw',
      (error) => expect(error.details).to.have.property('moduleName').that.equals('workbox-routing')
    );
  });

  it(`should not throw when loaded in a service worker in dev`, async function() {
    if (process.env.NODE_ENV == 'production') return this.skip();

    const core = await import('../../../packages/workbox-core/index.mjs');
    sandbox.stub(core.default.assert, 'isSwEnv').callsFake(() => true);

    await import('../../../packages/workbox-routing/index.mjs');
  });

  it(`should not throw when loaded outside of a service worker in production`, async function() {
    if (process.env.NODE_ENV != 'production') return this.skip();

    await import('../../../packages/workbox-routing/index.mjs');
  });
});

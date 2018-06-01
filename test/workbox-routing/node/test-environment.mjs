import clearRequire from 'clear-require';
import sinon from 'sinon';
import {expect} from 'chai';

import {assert} from '../../../packages/workbox-core/_private/assert.mjs';
import {devOnly} from '../../../infra/testing/env-it';
import expectError from '../../../infra/testing/expectError';

describe(`[workbox-routing] SW environment`, function() {
  const MODULE_PATH = '../../../packages/workbox-routing/index.mjs';
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  devOnly.it(`should throw when loaded outside of a service worker in dev`, async function() {
    const originalServiceWorkerGlobalScope = global.ServiceWorkerGlobalScope;
    delete global.ServiceWorkerGlobalScope;

    await expectError(async () => {
      await import(MODULE_PATH);
    }, 'not-in-sw', (err) => {
      expect(err.details).to.have.property('moduleName').that.equal('workbox-routing');
    });

    global.ServiceWorkerGlobalScope = originalServiceWorkerGlobalScope;
  });

  devOnly.it(`should not throw when in SW in dev`, async function() {
    sandbox.stub(assert, 'isSwEnv').callsFake(() => true);

    await import(MODULE_PATH);
  });

  devOnly.it(`should not throw in production`, async function() {
    await import(MODULE_PATH);
  });
});

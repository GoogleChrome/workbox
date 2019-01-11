/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';
import expectError from '../../../infra/testing/expectError';
import {assert} from '../../../packages/workbox-core/_private/assert.mjs';
import {devOnly, prodOnly} from '../../../infra/testing/env-it.js';

describe(`[workbox-precaching] WorkboxPrecaching`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.createSandbox();
  });

  beforeEach(function() {
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`Used in a window`, function() {
    devOnly.it(`should throw when loaded outside of a service worker in dev`, async function() {
      const originalServiceWorkerGlobalScope = global.ServiceWorkerGlobalScope;
      delete global.ServiceWorkerGlobalScope;

      await expectError(() => {
        return import('../../../packages/workbox-precaching/index.mjs');
      }, 'not-in-sw', (err) => {
        expect(err.details).to.have.property('moduleName').that.equal('workbox-precaching');
      });

      global.ServiceWorkerGlobalScope = originalServiceWorkerGlobalScope;
    });

    devOnly.it(`should not throw when in SW in dev`, async function() {
      sandbox.stub(assert, 'isSWEnv').callsFake(() => true);

      await import('../../../packages/workbox-precaching/index.mjs');
    });

    prodOnly.it(`should not throw in production`, async function() {
      await import('../../../packages/workbox-precaching/index.mjs');
    });
  });
});

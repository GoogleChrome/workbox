import clearRequire from 'clear-require';
import sinon from 'sinon';
import {expect} from 'chai';

import {assert} from '../../../packages/workbox-core/_private/assert.mjs';

describe(`[workbox-routing] Module Interface`, function() {
  let routingModule;
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    clearRequire.all();

    // Won't be needed after https://github.com/pinterest/service-workers/pull/44
    // is fixed
    if (process.env.NODE_ENV !== 'production') {
      sandbox.stub(assert, 'isSwEnv').callsFake(() => true);
    }

    // tmp here is to avoid @std/esm weirdness
    let tmp = await import('../../../packages/workbox-routing/index.mjs');
    routingModule = tmp;
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('default export', function() {
    it(`should be an instance of the expected class`, function() {
      expect(routingModule.default).to.be.an.instanceOf(routingModule.Router);
    });
  });

  describe('named exports', function() {
    it(`should export the expected interface`, function() {
      expect(routingModule).to.have.keys([
        'RegExpRoute',
        'Route',
        'Router',
        'NavigationRoute',
        'default',
      ]);
    });
  });
});

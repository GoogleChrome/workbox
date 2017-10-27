import sinon from 'sinon';
import {expect} from 'chai';
import expectError from '../../../../infra/testing/expectError';
import {devOnly, prodOnly} from '../../../../infra/testing/env-it';
import assert from '../../../../packages/workbox-core/_private/assert';

describe(`workbox-core  assert`, function() {
  describe(`Production Environment`, function() {
    prodOnly.it(`should return null`, function() {
      expect(assert).to.equal(null);
    });
  });

  describe(`isSwEnv`, function() {
    let sandbox;
    before(function() {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      sandbox.restore();
    });

    devOnly.it(`should throw if ServiceWorkerGlobalScope is not defined`, async function() {
      const originalServiceWorkerGlobalScope = global.ServiceWorkerGlobalScope;
      delete global.ServiceWorkerGlobalScope;

      await expectError(() => assert.isSwEnv('example-module'), 'not-in-sw');

      global.ServiceWorkerGlobalScope = originalServiceWorkerGlobalScope;
    });

    devOnly.it(`should return false if self is not an instance of ServiceWorkerGlobalScope`, function() {
      sandbox.stub(global, 'self').value({});

      return expectError(() => assert.isSwEnv('example-module'), 'not-in-sw');
    });

    devOnly.it(`should not throw is self is an instance of ServiceWorkerGlobalScope`, function() {
      sandbox.stub(global, 'self').value(new ServiceWorkerGlobalScope());
      assert.isSwEnv('example-module');
    });
  });

  describe(`isArray`, function() {
    devOnly.it(`shouldn't throw when given an array`, function() {
      assert.isArray([], {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });

    devOnly.it(`should throw when value isn't an array`, function() {
      return expectError(() => {
        assert.isArray({}, {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'not-an-array');
    });
  });
});

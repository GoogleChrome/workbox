import sinon from 'sinon';
import expectError from '../../../../infra/testing/expectError';

import assert from '../../../../packages/workbox-core/utils/assert';

describe(`workbox-core  assert`, function() {
  let sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`isSwEnv`, function() {
    it(`should throw if ServiceWorkerGlobalScope is not defined`, function() {
      sandbox.stub(global, 'ServiceWorkerGlobalScope').value(undefined);

      return expectError(() => assert.isSwEnv('example-module'), 'not-in-sw');
    });

    it(`should return false if self is not an instance of ServiceWorkerGlobalScope`, function() {
      sandbox.stub(global, 'self').value({});

      return expectError(() => assert.isSwEnv('example-module'), 'not-in-sw');
    });

    it(`should return true if self is an instance of ServiceWorkerGlobalScope`, function() {
      sandbox.stub(global, 'self').value(new ServiceWorkerGlobalScope());

      assert.isSwEnv('example-module');
    });
  });

  describe(`isArray`, function() {
    it(`shouldn't throw when given an array`, function() {
      assert.isArray([], {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });

    it(`should throw when value isn't an array`, function() {
      expectError(() => {
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

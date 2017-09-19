import expectError from '../../../../infra/utils/expectError';

import assert from '../../../../packages/workbox-core/utils/assert';

describe(`workbox-core  assert`, function() {
  describe(`isSwEnv`, function() {
    class FakeSWGlobalScope {}

    beforeEach(function() {
      delete global.ServiceWorkerGlobalScope;
      delete global.self;
    });

    afterEach(function() {
      delete global.ServiceWorkerGlobalScope;
      delete global.self;
    });

    it(`should throw if ServiceWorkerGlobalScope is not defined`, function() {
      return expectError(() => assert.isSwEnv('example-module'), 'not-in-sw');
    });

    it(`should return false if self is not an instance of ServiceWorkerGlobalScope`, function() {
      global.ServiceWorkerGlobalScope = FakeSWGlobalScope;
      global.self = {};

      return expectError(() => assert.isSwEnv('example-module'), 'not-in-sw');
    });

    it(`should return true if self is an instance of ServiceWorkerGlobalScope`, function() {
      class Test {}
      global.ServiceWorkerGlobalScope = Test;
      global.self = new Test();

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

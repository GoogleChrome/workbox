import expectError from '../../../../infra/utils/expectError';

import assert from '../../../../packages/workbox-core/utils/assert';

describe(`_assert`, function() {
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
});

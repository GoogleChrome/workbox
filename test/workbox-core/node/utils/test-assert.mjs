import {expect} from 'chai';

import assert from '../../../../packages/workbox-core/internal/utils/_assert';

describe(`_assert`, function() {
  describe(`isSWEnv`, function() {
    class FakeSWGlobalScope {}

    beforeEach(function() {
      delete global.ServiceWorkerGlobalScope;
      delete global.self;
    });

    afterEach(function() {
      delete global.ServiceWorkerGlobalScope;
      delete global.self;
    });

    it(`should return false if ServiceWorkerGlobalScope is not defined`, function() {
      expect(assert.isSWEnv()).to.equal(false);
    });

    it(`should return false if self is not an instance of ServiceWorkerGlobalScope`, function() {
      global.ServiceWorkerGlobalScope = FakeSWGlobalScope;
      global.self = {};

      expect(assert.isSWEnv()).to.equal(false);
    });

    it(`should return true if self is an instance of ServiceWorkerGlobalScope`, function() {
      class Test {}
      global.ServiceWorkerGlobalScope = Test;
      global.self = new Test();
      expect(assert.isSWEnv()).to.equal(true);
    });
  });
});

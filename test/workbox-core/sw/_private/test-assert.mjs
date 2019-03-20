/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert';
import {devOnly, prodOnly} from '../../../../infra/testing/env-it';


describe(`assert`, function() {
  describe(`Production Environment`, function() {
    prodOnly.it(`should return null`, function() {
      expect(assert).to.equal(null);
    });
  });

  describe(`isSWEnv`, function() {
    let sandbox;
    before(function() {
      sandbox = sinon.createSandbox();
    });

    afterEach(function() {
      sandbox.restore();
    });

    devOnly.it(`should throw if ServiceWorkerGlobalScope is not defined`, async function() {
      const originalServiceWorkerGlobalScope = self.ServiceWorkerGlobalScope;
      delete self.ServiceWorkerGlobalScope;

      await expectError(() => assert.isSWEnv('example-module'), 'not-in-sw');

      self.ServiceWorkerGlobalScope = originalServiceWorkerGlobalScope;
    });

    devOnly.it(`should return false if self is not an instance of ServiceWorkerGlobalScope`, function() {
      sandbox.stub(self, 'self').value({});

      return expectError(() => assert.isSWEnv('example-module'), 'not-in-sw');
    });

    devOnly.it(`should not throw if self is an instance of ServiceWorkerGlobalScope`, function() {
      assert.isSWEnv('example-module');
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

  describe(`isArrayOfClass`, function() {
    devOnly.it(`shouldn't throw when given an array same Class`, function() {
      class TestClass {}
      assert.isArrayOfClass([new TestClass(), new TestClass(), new TestClass()], TestClass, {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });

    devOnly.it(`should throw when value isn't an array of Class`, function() {
      class TestClass {}
      class NotTestClass {}
      return expectError(() => {
        assert.isArrayOfClass([new TestClass(), new NotTestClass(), new TestClass()], TestClass, {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'not-array-of-class');
    });

    devOnly.it(`should throw when value isn't an array`, function() {
      class TestClass {}
      return expectError(() => {
        assert.isArrayOfClass({}, TestClass, {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'not-array-of-class');
    });
  });

  describe(`hasMethod`, function() {
    devOnly.it(`should throw when it has no method`, function() {
      return expectError(() => {
        assert.hasMethod({}, 'methodName', {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'missing-a-method');
    });

    devOnly.it(`should throw when it has no method`, function() {
      assert.hasMethod({methodName: () => {}}, 'methodName', {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });
  });

  describe(`isInstance`, function() {
    devOnly.it(`should throw when it is not an instance`, function() {
      class Example {}
      return expectError(() => {
        assert.isInstance({}, Example, {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'incorrect-class');
    });

    devOnly.it(`should not throw when it is an instance`, function() {
      class Example {}
      assert.isInstance(new Example(), Example, {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });
  });

  describe(`isOneOf`, function() {
    devOnly.it(`should throw when it is not an instance`, function() {
      return expectError(() => {
        assert.isOneOf('not-ok', ['ok-value'], {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'invalid-value');
    });

    devOnly.it(`should throw when it is not an instance`, function() {
      assert.isOneOf('ok-value', ['ok-value'], {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });
  });
});

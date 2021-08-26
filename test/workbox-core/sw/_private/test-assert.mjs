/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert';

describe(`assert`, function () {
  it(`should be null in production mode`, function () {
    if (process.env.NODE_ENV === 'production') {
      expect(assert).to.equal(null);
    }
  });

  describe(`isArray`, function () {
    it(`shouldn't throw when given an array`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      assert.isArray([], {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });

    it(`should throw when value isn't an array`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        assert.isArray(
          {},
          {
            moduleName: 'module',
            className: 'class',
            funcName: 'func',
            paramName: 'param',
          },
        );
      }, 'not-an-array');
    });
  });

  describe(`isArrayOfClass`, function () {
    it(`shouldn't throw when given an array same Class`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      class TestClass {}
      assert.isArrayOfClass(
        [new TestClass(), new TestClass(), new TestClass()],
        TestClass,
        {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        },
      );
    });

    it(`should throw when value isn't an array of Class`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      class TestClass {}
      class NotTestClass {}
      return expectError(() => {
        assert.isArrayOfClass(
          [new TestClass(), new NotTestClass(), new TestClass()],
          TestClass,
          {
            moduleName: 'module',
            className: 'class',
            funcName: 'func',
            paramName: 'param',
          },
        );
      }, 'not-array-of-class');
    });

    it(`should throw when value isn't an array`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

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

  describe(`hasMethod`, function () {
    it(`should throw when it has no method`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        assert.hasMethod({}, 'methodName', {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'missing-a-method');
    });

    it(`should throw when it has no method`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      assert.hasMethod({methodName: () => {}}, 'methodName', {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });
  });

  describe(`isInstance`, function () {
    it(`should throw when it is not an instance`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

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

    it(`should not throw when it is an instance`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      class Example {}
      assert.isInstance(new Example(), Example, {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });
  });

  describe(`isOneOf`, function () {
    it(`should throw when it is not an instance`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        assert.isOneOf('not-ok', ['ok-value'], {
          moduleName: 'module',
          className: 'class',
          funcName: 'func',
          paramName: 'param',
        });
      }, 'invalid-value');
    });

    it(`should throw when it is not an instance`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      assert.isOneOf('ok-value', ['ok-value'], {
        moduleName: 'module',
        className: 'class',
        funcName: 'func',
        paramName: 'param',
      });
    });
  });
});

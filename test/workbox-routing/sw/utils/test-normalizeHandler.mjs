/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {normalizeHandler} from 'workbox-routing/utils/normalizeHandler.mjs';

const handler = {
  handle: () => {},
};
const functionHandler = () => {};

const invalidHandlerObject = {};
const invalidHandlerString = 'INVALID';

describe(`normalizeHandler()`, function () {
  it(`should properly normalize an object that exposes a handle method in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    const normalizedHandler = normalizeHandler(handler);
    expect(normalizedHandler).to.have.property('handle');
  });

  it(`should properly normalize a function in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    const normalizedHandler = normalizeHandler(functionHandler);
    expect(normalizedHandler).to.have.property('handle');
  });

  it(`should throw when called with an object that doesn't expose a handle method in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    await expectError(
      () => normalizeHandler(invalidHandlerObject),
      'missing-a-method',
      (error) => {
        expect(error.details)
          .to.have.property('moduleName')
          .that.equals('workbox-routing');
        expect(error.details)
          .to.have.property('className')
          .that.equals('Route');
        expect(error.details)
          .to.have.property('funcName')
          .that.equals('constructor');
        expect(error.details)
          .to.have.property('paramName')
          .that.equals('handler');
      },
    );
  });

  it(`should throw when called with something other than a function or an object in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    await expectError(
      () => normalizeHandler(invalidHandlerString),
      'incorrect-type',
      (error) => {
        expect(error.details)
          .to.have.property('moduleName')
          .that.equals('workbox-routing');
        expect(error.details)
          .to.have.property('className')
          .that.equals('Route');
        expect(error.details)
          .to.have.property('funcName')
          .that.equals('constructor');
        expect(error.details)
          .to.have.property('paramName')
          .that.equals('handler');
      },
    );
  });

  it(`should properly normalize an object that exposes a handle method in production`, async function () {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    const normalizedHandler = normalizeHandler(handler);
    expect(normalizedHandler).to.have.property('handle');
  });

  it(`should properly normalize a function in production`, async function () {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    const normalizedHandler = normalizeHandler(functionHandler);
    expect(normalizedHandler).to.have.property('handle');
  });
});

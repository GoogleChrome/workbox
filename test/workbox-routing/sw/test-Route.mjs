/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Route} from 'workbox-routing/Route.mjs';

const match = () => {};
const handler = {
  handle: () => {},
};
const functionHandler = () => {};
const method = 'POST';

const invalidHandlerObject = {};
const invalidMethod = 'INVALID';

describe(`Route`, function () {
  it(`should throw when called without any parameters in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    await expectError(
      () => new Route(),
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
      },
    );
  });

  it(`should throw when called without a valid handler parameter in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    await expectError(
      () => new Route(match),
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

    await expectError(
      () => new Route(match, invalidHandlerObject),
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

  it(`should throw when called without a valid match parameter in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    await expectError(
      () => new Route(null, handler),
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
          .that.equals('match');
      },
    );
  });

  it(`should not throw when called with valid handler.handle and match parameters in dev`, function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    expect(() => new Route(match, handler)).not.to.throw();
  });

  it(`should not throw when called with a valid function handler and match parameters in dev`, function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    expect(() => new Route(match, functionHandler)).not.to.throw();
  });

  it(`should throw when called with an invalid method in dev`, async function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    await expectError(
      () => new Route(match, handler, invalidMethod),
      'invalid-value',
      (error) =>
        expect(error.details)
          .to.have.property('paramName')
          .that.equals('method'),
    );
  });

  it(`should use the method provided when called with a valid method in dev`, function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    const route = new Route(match, handler, method);
    expect(route.method).to.equal(method);
  });

  it(`should use a default of GET when called without a method in dev`, function () {
    if (process.env.NODE_ENV === 'production') return this.skip();

    const route = new Route(match, handler);
    expect(route.method).to.equal('GET');
  });

  it(`should not throw when called with valid handler.handle and match parameters in production`, function () {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    expect(() => new Route(match, handler)).not.to.throw();
  });

  it(`should not throw when called with a valid function handler and match parameters in production`, function () {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    expect(() => new Route(match, functionHandler)).not.to.throw();
  });

  it(`should use the method provided when called with a valid method in production`, function () {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    const route = new Route(match, handler, method);
    expect(route.method).to.equal(method);
  });

  it(`should use a default of GET when called without a method in production`, function () {
    if (process.env.NODE_ENV !== 'production') return this.skip();

    const route = new Route(match, handler);
    expect(route.method).to.equal('GET');
  });
});

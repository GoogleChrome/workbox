import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError.js';

(async () => {
  const Route = (await import('../../../packages/workbox-routing/lib/Route.mjs')).default;

  const match = () => {};
  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};
  const method = 'POST';

  const invalidHandlerObject = {};
  const invalidHandlerString = 'INVALID';
  const invalidMethod = 'INVALID';

  describe(`workbox-routing.Route`, function() {
    describe(`constructor`, function() {
      it(`should throw when called without any parameters`, async function() {
        await expectError(
          () => new Route(),
          'not-of-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('funcName').that.equals('Route');
          }
        );
      });

      it(`should throw when called without a valid handler parameter`, async function() {
        await expectError(
          () => new Route({match}),
          'not-of-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('funcName').that.equals('Route');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );

        await expectError(
          () => new Route({match, handler: invalidHandlerObject}),
          'not-a-method',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('funcName').that.equals('Route');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );
      });

      it(`should throw when called without a valid match parameter`, async function() {
        await expectError(
          () => new Route({handler}),
          'not-of-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('funcName').that.equals('Route');
            expect(error.details).to.have.property('paramName').that.equals('match');
          }
        );
      });

      it(`should not throw when called with valid handler.handle and match parameters`, function() {
        expect(() => new Route({handler, match})).not.to.throw();
      });

      it(`should not throw when called with a valid function handler and match parameters`, function() {
        expect(() => new Route({handler: functionHandler, match})).not.to.throw();
      });

      it(`should throw when called with an invalid method`, async function() {
        await expectError(
          () => new Route({handler, match, method: invalidMethod}),
          'invalid-value',
          (error) => expect(error.details).to.have.property('paramName').that.equals('method')
        );
      });

      it(`should use the method provided when called with a valid method`, function() {
        const route = new Route({handler, match, method});
        expect(route.method).to.equal(method);
      });

      it(`should use a default of GET when called without a method`, function() {
        const route = new Route({handler, match});
        expect(route.method).to.equal('GET');
      });
    });

    describe(`_normalizeHandler`, function() {
      it(`should properly normalize an object that exposes a handle method`, async function() {
        const normalizedHandler = Route._normalizeHandler(handler);
        expect(normalizedHandler).to.have.property('handle');
      });

      it(`should properly normalize a function`, async function() {
        const normalizedHandler = Route._normalizeHandler(functionHandler);
        expect(normalizedHandler).to.have.property('handle');
      });

      it(`should throw when called with an object that doesn't expose a handle method`, async function() {
        await expectError(
          () => Route._normalizeHandler(invalidHandlerObject),
          'not-a-method',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('funcName').that.equals('Route');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );
      });

      it(`should throw when called with something other than a function or an object`, async function() {
        await expectError(
          () => Route._normalizeHandler(invalidHandlerString),
          'not-of-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('funcName').that.equals('Route');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );
      });
    });
  });
})();

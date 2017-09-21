import makeServiceWorkerEnv from 'service-worker-mock';
import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError.js';

(async () => {
  Object.assign(global, makeServiceWorkerEnv());
  const Route = (await import('../../../packages/workbox-routing/lib/Route.mjs')).default;

  const match = () => {};
  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};
  const method = 'POST';

  const invalidHandlerObject = {};
  const invalidMethod = 'INVALID';

  describe(`workbox-routing: Route`, function() {
    const initialNodeEnv = process.env.NODE_ENV;
    after(function() {
      process.env.NODE_ENV = initialNodeEnv;
    });

    describe(`(NODE_ENV = development)`, function() {
      before(function() {
        process.env.NODE_ENV = 'development';
      });

      it(`should throw when called without any parameters`, async function() {
        await expectError(
          () => new Route(),
          'incorrect-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('Route');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
          }
        );
      });

      it(`should throw when called without a valid handler parameter`, async function() {
        await expectError(
          () => new Route(match),
          'incorrect-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('Route');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );

        await expectError(
          () => new Route(match, invalidHandlerObject),
          'missing-a-method',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('Route');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );
      });

      it(`should throw when called without a valid match parameter`, async function() {
        await expectError(
          () => new Route(null, handler),
          'incorrect-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('Route');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('match');
          }
        );
      });

      it(`should not throw when called with valid handler.handle and match parameters`, function() {
        expect(() => new Route(match, handler)).not.to.throw();
      });

      it(`should not throw when called with a valid function handler and match parameters`, function() {
        expect(() => new Route(match, functionHandler)).not.to.throw();
      });

      it(`should throw when called with an invalid method`, async function() {
        await expectError(
          () => new Route(match, handler, invalidMethod),
          'invalid-value',
          (error) => expect(error.details).to.have.property('paramName').that.equals('method')
        );
      });

      it(`should use the method provided when called with a valid method`, function() {
        const route = new Route(match, handler, method);
        expect(route._method).to.equal(method);
      });

      it(`should use a default of GET when called without a method`, function() {
        const route = new Route(match, handler);
        expect(route._method).to.equal('GET');
      });
    });

    describe(`(NODE_ENV = production)`, function() {
      before(function() {
        process.env.NODE_ENV = 'production';
      });

      it(`should not throw when called with valid handler.handle and match parameters`, function() {
        expect(() => new Route(match, handler)).not.to.throw();
      });

      it(`should not throw when called with a valid function handler and match parameters`, function() {
        expect(() => new Route(match, functionHandler)).not.to.throw();
      });

      it(`should use the method provided when called with a valid method`, function() {
        const route = new Route(match, handler, method);
        expect(route._method).to.equal(method);
      });

      it(`should use a default of GET when called without a method`, function() {
        const route = new Route(match, handler);
        expect(route._method).to.equal('GET');
      });
    });
  });
})();

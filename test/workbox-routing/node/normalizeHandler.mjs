import makeServiceWorkerEnv from 'service-worker-mock';
import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError.js';

(async () => {
  Object.assign(global, makeServiceWorkerEnv());

  const normalizeHandler = (await import('../../../packages/workbox-routing/lib/normalizeHandler.mjs')).default;

  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};

  const invalidHandlerObject = {};
  const invalidHandlerString = 'INVALID';

  describe(`workbox-routing: _normalizeHandler`, function() {
    const initialNodeEnv = process.env.NODE_ENV;
    after(function() {
      process.env.NODE_ENV = initialNodeEnv;
    });

    describe(`(NODE_ENV = development)`, function() {
      before(function() {
        process.env.NODE_ENV = 'development';
      });

      it(`should properly normalize an object that exposes a handle method`, async function() {
        const normalizedHandler = normalizeHandler(handler);
        expect(normalizedHandler).to.have.property('handle');
      });

      it(`should properly normalize a function`, async function() {
        const normalizedHandler = normalizeHandler(functionHandler);
        expect(normalizedHandler).to.have.property('handle');
      });

      it(`should throw when called with an object that doesn't expose a handle method`, async function() {
        await expectError(
          () => normalizeHandler(invalidHandlerObject),
          'missing-a-method',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('Route');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );
      });

      it(`should throw when called with something other than a function or an object`, async function() {
        await expectError(
          () => normalizeHandler(invalidHandlerString),
          'incorrect-type',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('Route');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('handler');
          }
        );
      });
    });

    describe(`(NODE_ENV = production)`, function() {
      before(function() {
        process.env.NODE_ENV = 'production';
      });

      it(`should properly normalize an object that exposes a handle method`, async function() {
        const normalizedHandler = normalizeHandler(handler);
        expect(normalizedHandler).to.have.property('handle');
      });

      it(`should properly normalize a function`, async function() {
        const normalizedHandler = normalizeHandler(functionHandler);
        expect(normalizedHandler).to.have.property('handle');
      });
    });
  });
})();

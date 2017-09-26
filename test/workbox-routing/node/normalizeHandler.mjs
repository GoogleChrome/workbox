import clearRequire from 'clear-require';
import makeServiceWorkerEnv from 'service-worker-mock';
import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError.js';

Object.assign(global, makeServiceWorkerEnv());

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
    let normalizeHandler;

    before(async function() {
      process.env.NODE_ENV = 'development';

      clearRequire.all();

      // We need to import after setting the NODE_ENV so workbox-core also
      // gets the correct NODE_ENV
      const normalizeModule = await import('../../../packages/workbox-routing/lib/normalizeHandler.mjs');
      normalizeHandler = normalizeModule.default;
    });

    it(`should properly normalize an object that exposes a handle method`, function() {
      const normalizedHandler = normalizeHandler(handler);
      expect(normalizedHandler).to.have.property('handle');
    });

    it(`should properly normalize a function`, async function() {
      const normalizedHandler = normalizeHandler(functionHandler);
      expect(normalizedHandler).to.have.property('handle');
    });

    it(`should throw when called with an object that doesn't expose a handle method`, function() {
      return expectError(
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

    it(`should throw when called with something other than a function or an object`, function() {
      return expectError(
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
    let normalizeHandler;

    before(async function() {
      process.env.NODE_ENV = 'production';

      clearRequire.all();

      // We need to import after setting the NODE_ENV so workbox-core also
      // gets the correct NODE_ENV
      const normalizeModule = await import('../../../packages/workbox-routing/lib/normalizeHandler.mjs');
      normalizeHandler = normalizeModule.default;
    });

    it(`should properly normalize an object that exposes a handle method`, function() {
      const normalizedHandler = normalizeHandler(handler);
      expect(normalizedHandler).to.have.property('handle');
    });

    it(`should properly normalize a function`, function() {
      const normalizedHandler = normalizeHandler(functionHandler);
      expect(normalizedHandler).to.have.property('handle');
    });
  });
});

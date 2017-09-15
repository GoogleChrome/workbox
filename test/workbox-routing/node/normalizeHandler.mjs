import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError.js';

(async () => {
  const normalizeHandler = (await import('../../../packages/workbox-routing/lib/normalizeHandler.mjs')).default;

  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};

  const invalidHandlerObject = {};
  const invalidHandlerString = 'INVALID';

  describe(`workbox-routing`, function() {
    describe(`_normalizeHandler`, function() {
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
  });
})();

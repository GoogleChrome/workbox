import clearRequire from 'clear-require';
import {expect} from 'chai';

import expectError from '../../../infra/utils/expectError.js';

describe(`workbox-routing.Route`, function() {
  const match = () => {};
  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};
  const method = 'GET';

  const invalidHandler = {};
  const invalidMethod = 'INVALID';

  let Route;
  before(async function() {
    clearRequire.all();
    process.env.NODE_ENV = 'dev';
    Route = (await import('../../../packages/workbox-routing/lib/Route.mjs')).default;
  });

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
      () => new Route({match, handler: invalidHandler}),
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
});

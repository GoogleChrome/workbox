importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/sw-routing'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the Route class', function() {
  const match = () => {};
  const handler = {
    handle: () => {},
  };
  const functionHandler = () => {};
  const method = 'GET';

  const invalidHandler = {};
  const invalidMethod = 'INVALID';

  it(`should throw when Route() is called without any parameters`, function() {
    expect(() => new goog.routing.Route()).to.throw();
  });

  it(`should throw when Route() is called without a valid handler`, function() {
    expect(() => new goog.routing.Route({match})).to.throw();
    expect(() => new goog.routing.Route({match, handler: invalidHandler})).to.throw();
  });

  it(`should throw when Route() is called without a valid match`, function() {
    expect(() => new goog.routing.Route({handler})).to.throw();
  });

  it(`should not throw when Route() is called with valid handler.handle and match parameters`, function() {
    expect(() => new goog.routing.Route({handler, match})).not.to.throw();
  });

  it(`should not throw when Route() is called with a valid function handler and match parameters`, function() {
    expect(() => new goog.routing.Route({handler: functionHandler, match})).not.to.throw();
  });

  it(`should throw when Route() is called with an invalid method`, function() {
    expect(() => new goog.routing.Route({handler, match, method: invalidMethod})).to.throw();
  });

  it(`should use the method provided when Route() is called with a valid method`, function() {
    const route = new goog.routing.Route({handler, match, method});
    expect(route.method).to.equal(method);
  });

  it(`should use a default of GET when Route() is called without a method`, function() {
    const route = new goog.routing.Route({handler, match});
    expect(route.method).to.equal('GET');
  });
});

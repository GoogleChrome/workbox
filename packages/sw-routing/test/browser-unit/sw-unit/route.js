importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-routing/build/sw-routing.min.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the Route class', () => {
  const match = () => {};
  const handler = {
    handle: () => {},
  };
  const method = 'GET';

  const invalidHandler = {};
  const invalidMethod = 'INVALID';

  it(`should throw when Route() is called without any parameters`, () => {
    expect(() => new goog.routing.Route()).to.throw();
  });

  it(`should throw when Route() is called without a valid handler`, () => {
    expect(() => new goog.routing.Route({match})).to.throw();
    expect(() => new goog.routing.Route({match, handler: invalidHandler})).to.throw();
  });

  it(`should throw when Route() is called without a valid match`, () => {
    expect(() => new goog.routing.Route({handler})).to.throw();
  });

  it(`should not throw when Route() is called with valid handler and match parameters`, () => {
    expect(() => new goog.routing.Route({handler, match})).not.to.throw();
  });

  it(`should throw when Route() is called with an invalid method`, () => {
    expect(() => new goog.routing.Route({handler, match, method: invalidMethod})).to.throw();
  });

  it(`should use the method provided when Route() is called with a valid method`, () => {
    const route = new goog.routing.Route({handler, match, method});
    expect(route.method).to.equal(method);
  });

  it(`should use a default of GET when Route() is called without a method`, () => {
    const route = new goog.routing.Route({handler, match});
    expect(route.method).to.equal('GET');
  });
});

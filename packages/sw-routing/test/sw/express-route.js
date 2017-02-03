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

describe('Test of the ExpressRoute class', function() {
  const path = '/test/path';
  const handler = {
    handle: () => {},
  };
  const invalidHandler = {};

  it(`should throw when ExpressRoute() is called without any parameters`, function() {
    expect(() => new goog.routing.ExpressRoute()).to.throw();
  });

  it(`should throw when ExpressRoute() is called without a valid handler`, function() {
    expect(() => new goog.routing.ExpressRoute({path})).to.throw();
    expect(() => new goog.routing.ExpressRoute({path, handler: invalidHandler})).to.throw();
  });

  it(`should throw when ExpressRoute() is called without a valid path`, function() {
    expect(() => new goog.routing.ExpressRoute({handler})).to.throw();
  });

  it(`should not throw when ExpressRoute() is called with valid handler and path parameters`, function() {
    expect(() => new goog.routing.ExpressRoute({handler, path})).not.to.throw();
  });

  it(`should properly match URLs`, function() {
    const matchingUrl = new URL(path, location);
    const nonMatchingUrl = new URL('/does/not/match', location);

    const route = new goog.routing.ExpressRoute({handler, path});
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
  });

  it(`should properly match URLs with named parameters`, function() {
    const value1 = 'value1';
    const value2 = 'value2';

    const namedParameterPath = '/:param1/dummy/:param2';
    const namedParameterMatchingUrl = new URL(`/${value1}/dummy/${value2}`, location);
    const namedParameterNonMatchingUrl = new URL(`/${value1}/${value2}`, location);

    const route = new goog.routing.ExpressRoute({
      handler, path: namedParameterPath,
    });

    const match = route.match({url: namedParameterMatchingUrl});
    expect(Object.keys(match).length).to.equal(2);
    expect(match.param1).to.equal(value1);
    expect(match.param2).to.equal(value2);

    expect(route.match({url: namedParameterNonMatchingUrl})).not.to.be.ok;
  });
});

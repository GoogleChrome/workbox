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

describe('Test of the RegExpRoute class', () => {
  const path = '/test/path';
  const regExp = new RegExp(path);
  const matchingUrl = new URL(path, location);
  const handler = {
    handle: () => {},
  };

  const invalidHandler = {};
  const nonMatchingUrl = new URL('/does/not/match', location);

  it(`should throw when RegExpRoute() is called without any parameters`, () => {
    expect(() => new goog.routing.RegExpRoute()).to.throw();
  });

  it(`should throw when RegExpRoute() is called without a valid handler`, () => {
    expect(() => new goog.routing.RegExpRoute({path})).to.throw();
    expect(() => new goog.routing.RegExpRoute({path, handler: invalidHandler})).to.throw();
  });

  it(`should throw when RegExpRoute() is called without a valid regExp`, () => {
    expect(() => new goog.routing.RegExpRoute({handler})).to.throw();
  });

  it(`should not throw when RegExpRoute() is called with valid handler and regExp parameters`, () => {
    expect(() => new goog.routing.RegExpRoute({handler, regExp})).not.to.throw();
  });

  it(`should properly match URLs`, () => {
    const route = new goog.routing.RegExpRoute({handler, regExp});
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
  });
});

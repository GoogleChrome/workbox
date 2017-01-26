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
  const handler = {
    handle: () => {},
  };
  const invalidHandler = {};

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
    const matchingUrl = new URL(path, location);
    const nonMatchingUrl = new URL('/does/not/match', location);

    const route = new goog.routing.RegExpRoute({handler, regExp});
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
  });

  it(`should properly match URLs with capture groups`, () => {
    const value1 = 'value1';
    const value2 = 'value2';

    const captureGroupRegExp = new RegExp('/(\\w+)/dummy/(\\w+)');
    const captureGroupMatchingUrl = new URL(`/${value1}/dummy/${value2}`, location);
    const captureGroupNonMatchingUrl = new URL(`/${value1}/${value2}`, location);

    const route = new goog.routing.RegExpRoute({
      handler, regExp: captureGroupRegExp,
    });

    const match = route.match({url: captureGroupMatchingUrl});
    expect(match.length).to.equal(2);
    expect(match[0]).to.equal(value1);
    expect(match[1]).to.equal(value2);

    expect(route.match({url: captureGroupNonMatchingUrl})).not.to.be.ok;
  });
});

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

describe('Test of the RegExpRoute class', function() {
  const crossOrigin = 'https://cross-origin.example.com';
  const path = '/test/path';
  const regExp = new RegExp(path);
  const handler = {
    handle: () => {},
  };
  const invalidHandler = {};

  it(`should throw when RegExpRoute() is called without any parameters`, function() {
    expect(() => new goog.routing.RegExpRoute()).to.throw();
  });

  it(`should throw when RegExpRoute() is called without a valid handler`, function() {
    expect(() => new goog.routing.RegExpRoute({path})).to.throw();
    expect(() => new goog.routing.RegExpRoute({path, handler: invalidHandler})).to.throw();
  });

  it(`should throw when RegExpRoute() is called without a valid regExp`, function() {
    expect(() => new goog.routing.RegExpRoute({handler})).to.throw();
  });

  it(`should not throw when RegExpRoute() is called with valid handler and regExp parameters`, function() {
    expect(() => new goog.routing.RegExpRoute({handler, regExp})).not.to.throw();
  });

  it(`should properly match URLs`, function() {
    const matchingUrl = new URL(path, location);
    const nonMatchingUrl = new URL('/does/not/match', location);
    const crossOriginUrl = new URL(path, crossOrigin);

    const route = new goog.routing.RegExpRoute({handler, regExp});
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
    // This route will not match because while the RegExp matches, the match
    // doesn't occur at the start of the cross-origin URL.
    expect(route.match({url: crossOriginUrl})).not.to.be.ok;
  });

  it(`should properly match cross-origin URLs with wildcards`, function() {
    const matchingUrl = new URL('https://fonts.googleapis.com/icon?family=Material+Icons');
    const matchingUrl2 = new URL('https://code.getmdl.io/1.2.1/material.indigo-pink.min.css');

    const route = new goog.routing.RegExpRoute({
      handler,
      regExp: /.*\.(?:googleapis|getmdl)\.(?:com|io)\/.*/,
    });
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: matchingUrl2})).to.be.ok;
  });

  it(`should properly match cross-origin URLs without wildcards`, function() {
    const matchingUrl = new URL(path, crossOrigin);
    const nonMatchingUrl = new URL('/does/not/match', crossOrigin);
    const crossOriginRegExp = new RegExp(crossOrigin + path);

    const route = new goog.routing.RegExpRoute({handler, regExp: crossOriginRegExp});
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
  });

  it(`should properly match URLs with capture groups`, function() {
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

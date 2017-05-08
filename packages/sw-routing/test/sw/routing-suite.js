// This tests Express and RegExp routing side by side, to ensure consistent,
// expected behavior across the same set of URLs.

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

describe('Express/RegExp Routing Suite', function() {
  const crossOrigin = 'https://cross-origin.example.com/';
  const handler = () => {};

  const testCases = [{
    requestUrl: new URL(crossOrigin),
    regExp: '/',
    express: '/',
    shouldMatch: false,
    reason: `Cross-origin requests should not match when the match is not at the first character.`,
  }, {
    requestUrl: new URL(crossOrigin),
    regExp: crossOrigin,
    express: crossOrigin,
    shouldMatch: true,
    reason: `Cross-origin requests should match when the match is at the first character.`,
  }, {
    requestUrl: new URL('/', location.origin),
    regExp: '/',
    express: '/',
    shouldMatch: true,
    reason: `Same-origin requests only need to match on the pathname.`,
  }, {
    requestUrl: new URL('/', location.origin),
    regExp: crossOrigin,
    express: crossOrigin,
    shouldMatch: false,
    reason: `Requests should not match when the origins are different.`,
  }];

  for (let testCase of testCases) {
    it(testCase.reason, function() {
      const regExpRoute = new goog.routing.RegExpRoute({
        handler,
        regExp: new RegExp(testCase.regExp),
      });
      const expressRoute = new goog.routing.ExpressRoute({
        handler,
        path: testCase.express,
      });

      expect(Boolean(regExpRoute.match({url: testCase.requestUrl})))
        .to.equal(testCase.shouldMatch, 'RegExp Route');
      expect(Boolean(expressRoute.match({url: testCase.requestUrl})))
        .to.equal(testCase.shouldMatch, 'Express Route');
    });
  }
});

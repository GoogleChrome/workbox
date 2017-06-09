importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-routing');

// This tests Express and RegExp routing side by side, to ensure consistent,
// expected behavior across the same set of URLs.

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
      const regExpRoute = new workbox.routing.RegExpRoute({
        handler,
        regExp: new RegExp(testCase.regExp),
      });
      const expressRoute = new workbox.routing.ExpressRoute({
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

/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-env mocha, browser */

import ExpressRoute from '../../src/lib/express-route.js';
import RegExpRoute from '../../src/lib/regexp-route.js';

// This tests Express and RegExp routing side by side, to ensure consistent,
// expected behavior across the same set of URLs.

describe(`Express/RegExp Routing Suite`, function() {
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
      const regExpRoute = new RegExpRoute({
        handler,
        regExp: new RegExp(testCase.regExp),
      });
      const expressRoute = new ExpressRoute({
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

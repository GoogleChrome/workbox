/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {RegExpRoute} from 'workbox-routing/RegExpRoute.mjs';

describe(`RegExpRoute`, function () {
  const SAME_ORIGIN_URL = new URL('https://example.com');
  const CROSS_ORIGIN_URL = new URL('https://cross-origin-example.com');
  const PATH = '/test/path';
  const HANDLER = {handle: () => {}};

  const sandbox = sinon.createSandbox();
  beforeEach(function () {
    sandbox.restore();
    sandbox.stub(self, 'location').value(SAME_ORIGIN_URL);
  });
  after(function () {
    sandbox.restore();
  });

  for (const badRegExp of [undefined, null, 123, '123', {}]) {
    it(`should throw when called with a regExp parameter of ${JSON.stringify(
      badRegExp,
    )} in dev`, async function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      await expectError(
        () => new RegExpRoute(),
        'incorrect-class',
        (error) => {
          expect(error.details)
            .to.have.property('moduleName')
            .that.equals('workbox-routing');
          expect(error.details)
            .to.have.property('className')
            .that.equals('RegExpRoute');
          expect(error.details)
            .to.have.property('funcName')
            .that.equals('constructor');
          expect(error.details)
            .to.have.property('paramName')
            .that.equals('pattern');
        },
      );
    });
  }

  it(`should not throw when called with valid parameters`, function () {
    expect(() => new RegExpRoute(new RegExp('/test/'), HANDLER)).not.to.throw();
  });

  it(`should properly match URLs`, function () {
    const matchingURL = new URL(PATH, SAME_ORIGIN_URL);
    const nonMatchingURL = new URL('/does/not/match', SAME_ORIGIN_URL);
    const crossOriginURL = new URL(PATH, CROSS_ORIGIN_URL);
    const regExp = new RegExp(PATH);

    const route = new RegExpRoute(regExp, HANDLER);
    expect(route.match({url: matchingURL})).to.be.ok;
    expect(route.match({url: nonMatchingURL})).not.to.be.ok;
    // This route will not match because while the RegExp matches, the match
    // doesn't occur at the start of the cross-origin URL.
    expect(route.match({url: crossOriginURL})).not.to.be.ok;
  });

  it(`should properly match cross-origin URLs with wildcards`, function () {
    const matchingURL = new URL(
      'https://fonts.googleapis.com/icon?family=Material+Icons',
    );
    const matchingURL2 = new URL(
      'https://code.getmdl.io/1.2.1/material.indigo-pink.min.css',
    );

    const route = new RegExpRoute(
      /.*\.(?:googleapis|getmdl)\.(?:com|io)\/.*/,
      HANDLER,
    );
    expect(route.match({url: matchingURL})).to.be.ok;
    expect(route.match({url: matchingURL2})).to.be.ok;
  });

  it(`should properly match cross-origin URLs without wildcards`, function () {
    const matchingURL = new URL(PATH, CROSS_ORIGIN_URL);
    const nonMatchingURL = new URL('/does/not/match', CROSS_ORIGIN_URL);
    const crossOriginRegExp = new RegExp(matchingURL.href);

    const route = new RegExpRoute(crossOriginRegExp, HANDLER);
    expect(route.match({url: matchingURL})).to.be.ok;
    expect(route.match({url: nonMatchingURL})).not.to.be.ok;
  });

  it(`should properly match URLs with capture groups`, function () {
    const value1 = 'value1';
    const value2 = 'value2';

    const captureGroupRegExp = new RegExp('/(\\w+)/dummy/(\\w+)');
    const captureGroupMatchingURL = new URL(
      `/${value1}/dummy/${value2}`,
      SAME_ORIGIN_URL,
    );
    const captureGroupNonMatchingURL = new URL(
      `/${value1}/${value2}`,
      SAME_ORIGIN_URL,
    );

    const route = new RegExpRoute(captureGroupRegExp, HANDLER);

    const match = route.match({url: captureGroupMatchingURL});
    expect(match.length).to.equal(2);
    expect(match[0]).to.equal(value1);
    expect(match[1]).to.equal(value2);

    expect(route.match({url: captureGroupNonMatchingURL})).not.to.be.ok;
  });
});

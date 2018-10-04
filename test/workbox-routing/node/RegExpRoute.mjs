import sinon from 'sinon';
import {expect} from 'chai';

import {RegExpRoute} from '../../../packages/workbox-routing/RegExpRoute.mjs';
import expectError from '../../../infra/testing/expectError.js';
import {devOnly} from '../../../infra/testing/env-it.js';

describe(`[workbox-routing] RegExpRoute`, function() {
  const SAME_ORIGIN_URL = new URL('https://example.com');
  const CROSS_ORIGIN_URL = new URL('https://cross-origin-example.com');
  const PATH = '/test/path';
  const HANDLER = {handle: () => {}};

  const sandbox = sinon.createSandbox();
  beforeEach(function() {
    sandbox.restore();
    sandbox.stub(global, 'location').value(SAME_ORIGIN_URL);
  });
  after(function() {
    sandbox.restore();
  });

  for (const badRegExp of [undefined, null, 123, '123', {}]) {
    devOnly.it(`should throw when called with a regExp parameter of ${JSON.stringify(badRegExp)} in dev`, async function() {
      await expectError(
          () => new RegExpRoute(),
          'incorrect-class',
          (error) => {
            expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
            expect(error.details).to.have.property('className').that.equals('RegExpRoute');
            expect(error.details).to.have.property('funcName').that.equals('constructor');
            expect(error.details).to.have.property('paramName').that.equals('pattern');
          }
      );
    });
  }

  it(`should not throw when called with valid parameters`, function() {
    expect(() => new RegExpRoute(new RegExp('/test/'), HANDLER)).not.to.throw();
  });

  it(`should properly match URLs`, function() {
    const matchingUrl = new URL(PATH, SAME_ORIGIN_URL);
    const nonMatchingUrl = new URL('/does/not/match', SAME_ORIGIN_URL);
    const crossOriginUrl = new URL(PATH, CROSS_ORIGIN_URL);
    const regExp = new RegExp(PATH);

    const route = new RegExpRoute(regExp, HANDLER);
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
    // This route will not match because while the RegExp matches, the match
    // doesn't occur at the start of the cross-origin URL.
    expect(route.match({url: crossOriginUrl})).not.to.be.ok;
  });

  it(`should properly match cross-origin URLs with wildcards`, function() {
    const matchingUrl = new URL('https://fonts.googleapis.com/icon?family=Material+Icons');
    const matchingUrl2 = new URL('https://code.getmdl.io/1.2.1/material.indigo-pink.min.css');

    const route = new RegExpRoute(/.*\.(?:googleapis|getmdl)\.(?:com|io)\/.*/, HANDLER);
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: matchingUrl2})).to.be.ok;
  });

  it(`should properly match cross-origin URLs without wildcards`, function() {
    const matchingUrl = new URL(PATH, CROSS_ORIGIN_URL);
    const nonMatchingUrl = new URL('/does/not/match', CROSS_ORIGIN_URL);
    const crossOriginRegExp = new RegExp(matchingUrl.href);

    const route = new RegExpRoute(crossOriginRegExp, HANDLER);
    expect(route.match({url: matchingUrl})).to.be.ok;
    expect(route.match({url: nonMatchingUrl})).not.to.be.ok;
  });

  it(`should properly match URLs with capture groups`, function() {
    const value1 = 'value1';
    const value2 = 'value2';

    const captureGroupRegExp = new RegExp('/(\\w+)/dummy/(\\w+)');
    const captureGroupMatchingUrl = new URL(`/${value1}/dummy/${value2}`, SAME_ORIGIN_URL);
    const captureGroupNonMatchingUrl = new URL(`/${value1}/${value2}`, SAME_ORIGIN_URL);

    const route = new RegExpRoute(captureGroupRegExp, HANDLER);

    const match = route.match({url: captureGroupMatchingUrl});
    expect(match.length).to.equal(2);
    expect(match[0]).to.equal(value1);
    expect(match[1]).to.equal(value2);

    expect(route.match({url: captureGroupNonMatchingUrl})).not.to.be.ok;
  });
});

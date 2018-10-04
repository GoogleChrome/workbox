import {expect} from 'chai';
import expectError from '../../../infra/testing/expectError.js';
import {devOnly} from '../../../infra/testing/env-it';
import {NavigationRoute} from '../../../packages/workbox-routing/NavigationRoute.mjs';

const match = () => {};
const handler = {
  handle: () => {},
};
const functionHandler = () => {};

const invalidHandlerObject = {};

describe(`[workbox-routing] NavigationRoute`, function() {
  devOnly.it(`should throw when called without a valid handler parameter in dev`, async function() {
    await expectError(
        () => new NavigationRoute(),
        'incorrect-type',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
          expect(error.details).to.have.property('className').that.equals('Route');
          expect(error.details).to.have.property('funcName').that.equals('constructor');
          expect(error.details).to.have.property('paramName').that.equals('handler');
        }
    );

    await expectError(
        () => new NavigationRoute(invalidHandlerObject),
        'missing-a-method',
        (error) => {
          expect(error.details).to.have.property('moduleName').that.equals('workbox-routing');
          expect(error.details).to.have.property('className').that.equals('Route');
          expect(error.details).to.have.property('funcName').that.equals('constructor');
          expect(error.details).to.have.property('paramName').that.equals('handler');
        }
    );
  });

  it(`should not throw when called with valid handler in dev`, function() {
    expect(() => new NavigationRoute(match, handler)).not.to.throw();
  });

  it(`should not throw when called with a valid function handler`, function() {
    expect(() => new NavigationRoute(functionHandler)).not.to.throw();
  });

  it(`should have a HTTP method of 'GET'`, async function() {
    const route = new NavigationRoute(handler);
    expect(route.method).to.equal('GET');
  });

  it(`should match all navigation requests by default`, function() {
    const urls = [
      new URL('/', self.location).toString(),
      new URL('/testing/path.html', self.location).toString(),
    ];
    const navigationRoute = new NavigationRoute(handler);
    urls.forEach((url) => {
      const request = new Request(url, {
        mode: 'navigate',
      });
      expect(navigationRoute.match({event: {request}, url})).to.equal(true);
    });
  });

  it(`should not match non- navigation requests by default`, function() {
    const urls = [
      new URL('/', self.location),
      new URL('/testing/path.html', self.location),
    ];
    const navigationRoute = new NavigationRoute(handler);
    urls.forEach((url) => {
      const request = new Request(url);
      expect(navigationRoute.match({event: {request}, url})).to.equal(false);
    });
  });

  it(`should not include urls in blacklist that completely match`, function() {
    const url = new URL('/testing/path.html', self.location);
    const request = new Request(url, {
      mode: 'navigate',
    });

    const navigationRoute = new NavigationRoute(handler, {
      blacklist: [/\/testing\/.*/],
    });

    expect(navigationRoute.match({event: {request}, url})).to.equal(false);
  });

  it(`should blacklist urls with search params that result in partial match with regex`, function() {
    const url = new URL('/testing/path.html?test=hello', self.location);
    const request = new Request(url, {
      mode: 'navigate',
    });

    const navigationRoute = new NavigationRoute(handler, {
      blacklist: [/\/testing\/path.html/],
    });

    expect(navigationRoute.match({event: {request}, url})).to.equal(false);
  });

  it(`should only match urls in custom whitelist`, function() {
    let url = new URL('/testing/path.html?test=hello', self.location);
    let request = new Request(url, {
      mode: 'navigate',
    });

    const navigationRoute = new NavigationRoute(handler, {
      whitelist: [/\/testing\/path.html/],
    });

    expect(navigationRoute.match({event: {request}, url})).to.equal(true);

    url = new URL('/other/path.html?test=hello', self.location);
    request = new Request(url, {
      mode: 'navigate',
    });

    expect(navigationRoute.match({event: {request}, url})).to.equal(false);
  });

  it(`should take blacklist as priority`, function() {
    let url = new URL('/testing/path.html?test=hello', self.location);
    let request = new Request(url, {
      mode: 'navigate',
    });

    const navigationRoute = new NavigationRoute(handler, {
      whitelist: [/\/testing\/.*/],
      blacklist: [/\/testing\/path.html/],
    });

    expect(navigationRoute.match({event: {request}, url})).to.equal(false);

    url = new URL('/testing/index.html?test=hello', self.location);
    request = new Request(url, {
      mode: 'navigate',
    });

    expect(navigationRoute.match({event: {request}, url})).to.equal(true);
  });
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {NavigationRoute} from 'workbox-routing/NavigationRoute.mjs';

const handler = {
  handle: () => {},
};
const functionHandler = () => {};

const invalidHandlerObject = {};

describe(`NavigationRoute`, function () {
  it(`should throw when called without a valid handler parameter in dev`, async function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    await expectError(
      () => new NavigationRoute(),
      'incorrect-type',
      (error) => {
        expect(error.details)
          .to.have.property('moduleName')
          .that.equals('workbox-routing');
        expect(error.details)
          .to.have.property('className')
          .that.equals('Route');
        expect(error.details)
          .to.have.property('funcName')
          .that.equals('constructor');
        expect(error.details)
          .to.have.property('paramName')
          .that.equals('handler');
      },
    );

    await expectError(
      () => new NavigationRoute(invalidHandlerObject),
      'missing-a-method',
      (error) => {
        expect(error.details)
          .to.have.property('moduleName')
          .that.equals('workbox-routing');
        expect(error.details)
          .to.have.property('className')
          .that.equals('Route');
        expect(error.details)
          .to.have.property('funcName')
          .that.equals('constructor');
        expect(error.details)
          .to.have.property('paramName')
          .that.equals('handler');
      },
    );
  });

  it(`should not throw when called with valid handler in dev`, function () {
    expect(() => new NavigationRoute(handler)).not.to.throw();
  });

  it(`should not throw when called with a valid function handler`, function () {
    expect(() => new NavigationRoute(functionHandler)).not.to.throw();
  });

  it(`should have a HTTP method of 'GET'`, async function () {
    const route = new NavigationRoute(handler);
    expect(route.method).to.equal('GET');
  });

  it(`should match all navigation requests by default`, function () {
    const urls = [
      new URL('/', self.location).toString(),
      new URL('/testing/path.html', self.location).toString(),
    ];
    const navigationRoute = new NavigationRoute(handler);
    urls.forEach((url) => {
      const request = new Request(url);
      Object.defineProperty(request, 'mode', {value: 'navigate'});

      expect(navigationRoute.match({request, url})).to.equal(true);
    });
  });

  it(`should not match non- navigation requests by default`, function () {
    const urls = [
      new URL('/', self.location),
      new URL('/testing/path.html', self.location),
    ];
    const navigationRoute = new NavigationRoute(handler);
    urls.forEach((url) => {
      const request = new Request(url);
      expect(navigationRoute.match({request, url})).to.equal(false);
    });
  });

  it(`should not include urls in denylist that completely match`, function () {
    const url = new URL('/testing/path.html', self.location);
    const request = new Request(url);
    Object.defineProperty(request, 'mode', {value: 'navigate'});

    const navigationRoute = new NavigationRoute(handler, {
      denylist: [/\/testing\/.*/],
    });

    expect(navigationRoute.match({request, url})).to.equal(false);
  });

  it(`should denylist urls with search params that result in partial match with regex`, function () {
    const url = new URL('/testing/path.html?test=hello', self.location);
    const request = new Request(url);
    Object.defineProperty(request, 'mode', {value: 'navigate'});

    const navigationRoute = new NavigationRoute(handler, {
      denylist: [/\/testing\/path.html/],
    });

    expect(navigationRoute.match({request, url})).to.equal(false);
  });

  it(`should only match urls in custom allowlist`, function () {
    let url = new URL('/testing/path.html?test=hello', self.location);
    let request = new Request(url);
    Object.defineProperty(request, 'mode', {value: 'navigate'});

    const navigationRoute = new NavigationRoute(handler, {
      allowlist: [/\/testing\/path.html/],
    });

    expect(navigationRoute.match({request, url})).to.equal(true);

    url = new URL('/other/path.html?test=hello', self.location);
    request = new Request(url);
    Object.defineProperty(request, 'mode', {value: 'navigate'});

    expect(navigationRoute.match({request, url})).to.equal(false);
  });

  it(`should take denylist as priority`, function () {
    let url = new URL('/testing/path.html?test=hello', self.location);
    let request = new Request(url);
    Object.defineProperty(request, 'mode', {value: 'navigate'});

    const navigationRoute = new NavigationRoute(handler, {
      allowlist: [/\/testing\/.*/],
      denylist: [/\/testing\/path.html/],
    });

    expect(navigationRoute.match({request, url})).to.equal(false);

    url = new URL('/testing/index.html?test=hello', self.location);
    request = new Request(url);
    Object.defineProperty(request, 'mode', {value: 'navigate'});

    expect(navigationRoute.match({request, url})).to.equal(true);
  });
});

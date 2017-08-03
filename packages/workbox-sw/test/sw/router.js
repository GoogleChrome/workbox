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

import WorkboxSW from '../../src';

describe(`Test workboxSW.router`, function() {
  it(`should be accessible workboxSW.router`, function() {
    const workboxSW = new WorkboxSW();
    expect(workboxSW.router).to.exist;
  });

  const badInput = [
    {
      capture: null,
      errorName: 'unsupported-route-type',
    },
    {
      capture: 123,
      errorName: 'unsupported-route-type',
    },
    {
      capture: true,
      errorName: 'unsupported-route-type',
    },
    {
      capture: false,
      errorName: 'unsupported-route-type',
    },
    {
      capture: {},
      errorName: 'unsupported-route-type',
    },
    {
      capture: [],
      errorName: 'unsupported-route-type',
    },
    {
      capture: '',
      errorName: 'empty-express-string',
    },
  ];
  badInput.forEach((badInput) => {
    it(`should throw on adding invalid route: ${JSON.stringify(badInput)}`, function() {
      let thrownError = null;
      const workboxSW = new WorkboxSW();
      try {
        workboxSW.router.registerRoute(badInput.capture, () => {});
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      if (thrownError.name !== badInput.errorName) {
        console.error(thrownError);
        throw new Error(`Expected thrownError.name to equal '${badInput.errorName}'`);
      }
    });
  });

  it(`should be able to register a valid express route`, function() {
    const date = Date.now();
    const fakeID = '1234567890';
    const expressRoute = `/:date/:id/test/`;
    const exampleRoute = `/${date}/${fakeID}/test/`;
    const workboxSW = new WorkboxSW();

    return new Promise((resolve) => {
      const route = workboxSW.router.registerRoute(expressRoute, (args) => {
        (args.event instanceof FetchEvent).should.equal(true);
        args.url.toString().should.equal(new URL(exampleRoute, location).toString());
        Object.keys(args.params).length.should.equal(2);
        args.params.date.should.equal(date.toString());
        args.params.id.should.equal(fakeID);

        resolve();
      });
      expect(route).to.exist;

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });

  it(`should be able to register a valid regex route`, function() {
    const capturingGroup = 'test';
    const regExp = /\/1234567890\/(\w+)\//;
    const exampleRoute = `/1234567890/${capturingGroup}/`;
    const workboxSW = new WorkboxSW();

    return new Promise((resolve) => {
      const route = workboxSW.router.registerRoute(regExp, (args) => {
        (args.event instanceof FetchEvent).should.equal(true);
        args.url.toString().should.equal(new URL(exampleRoute, location).toString());
        args.params.length.should.equal(1);
        args.params[0].should.equal(capturingGroup);

        resolve();
      });
      expect(route).to.exist;

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });

  it(`should throw when registerNavigationRoute() isn't passed a URL`, function() {
    let thrownError = null;
    const workboxSW = new WorkboxSW();
    try {
      workboxSW.router.registerNavigationRoute();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('navigation-route-url-string');
  });

  it(`should throw when the method passed in to registerRoute() isn't valid`, function() {
    const workboxSW = new WorkboxSW();
    try {
      workboxSW.router.registerRoute(/123/, () => {}, 'INVALID_METHOD');
      throw new Error();
    } catch (error) {
      expect(error.name).to.eql('assertion-failed',
        `The expected assertion-failed error wasn't thrown.`);
    }
  });

  it(`should use the valid method passed in to registerRoute()`, function() {
    const workboxSW = new WorkboxSW();
    const method = 'POST';
    const route = workboxSW.router.registerRoute(/123/, () => {}, method);
    expect(route.method).to.eql(method);
  });

  it(`should support calling registerRoute() with a function as the capture parameter`, function() {
    const workboxSW = new WorkboxSW();
    const route = workboxSW.router.registerRoute(() => {}, () => {});
    expect(route).to.exist;
  });
});

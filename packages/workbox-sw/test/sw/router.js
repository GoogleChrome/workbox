importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-sw');

describe('Test workboxSW.router', function() {
  it('should be accessible workboxSW.router', function() {
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

  it('should be able to register a valid express route', function() {
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

  it('should be able to register a valid regex route', function() {
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
});

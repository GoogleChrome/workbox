importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-routing');

describe('Test of the Router class', function() {
  const MATCH = () => {};
  const HANDLER = () => {};

  let globalStubs = [];
  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should call _addFetchListener() when Router() is called without any parameters`, function() {
    const _addFetchListener = sinon.spy(workbox.routing.Router.prototype, '_addFetchListener');
    globalStubs.push(_addFetchListener);

    new workbox.routing.Router();
    expect(_addFetchListener.calledOnce).to.be.true;
  });

  it(`should call _addFetchListener() when Router() is called with handleFetch: true`, function() {
    const _addFetchListener = sinon.spy(workbox.routing.Router.prototype, '_addFetchListener');
    globalStubs.push(_addFetchListener);

    new workbox.routing.Router({handleFetch: true});
    expect(_addFetchListener.calledOnce).to.be.true;
  });

  it(`should call _addFetchListener() when Router() is called with handleFetch: false`, function() {
    const _addFetchListener = sinon.spy(workbox.routing.Router.prototype, '_addFetchListener');
    globalStubs.push(_addFetchListener);

    new workbox.routing.Router({handleFetch: false});
    expect(_addFetchListener.calledOnce).to.be.false;
  });

  it(`should modify the internal arrays of routes when register/unregister is called`, function() {
    const router = new workbox.routing.Router();

    // Routes without an explicit method will default to GET.
    const getRoute1 = new workbox.routing.Route({match: MATCH, handler: HANDLER});
    const getRoute2 = new workbox.routing.Route({match: MATCH, handler: HANDLER, method: 'GET'});
    const putRoute1 = new workbox.routing.Route({match: MATCH, handler: HANDLER, method: 'PUT'});
    const putRoute2 = new workbox.routing.Route({match: MATCH, handler: HANDLER, method: 'PUT'});

    router.registerRoute({route: getRoute1});
    router.registerRoutes({routes: [getRoute2, putRoute1, putRoute2]});

    expect(router._routes.get('GET')).to.have.members([getRoute1, getRoute2]);
    expect(router._routes.get('PUT')).to.have.members([putRoute1, putRoute2]);

    router.unregisterRoutes({routes: [getRoute2]});
    router.unregisterRoute({route: putRoute2});

    expect(router._routes.get('GET')).to.have.members([getRoute1]);
    expect(router._routes.get('PUT')).to.have.members([putRoute1]);
  });
});

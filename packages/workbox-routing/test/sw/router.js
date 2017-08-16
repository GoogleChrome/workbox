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

import Route from '../../src/lib/route.js';
import Router from '../../src/lib/router.js';

describe(`Test of the Router class`, function() {
  const MATCH = () => {};
  const HANDLER = () => {};

  let globalStubs = [];
  afterEach(function() {
    globalStubs.forEach((stub) => stub.restore());
    globalStubs = [];
  });

  it(`should call _addFetchListener() when Router() is called without any parameters`, function() {
    const _addFetchListener = sinon.spy(Router.prototype, '_addFetchListener');
    globalStubs.push(_addFetchListener);

    new Router();
    expect(_addFetchListener.calledOnce).to.be.true;
  });

  it(`should call _addFetchListener() when Router() is called with handleFetch: true`, function() {
    const _addFetchListener = sinon.spy(Router.prototype, '_addFetchListener');
    globalStubs.push(_addFetchListener);

    new Router({handleFetch: true});
    expect(_addFetchListener.calledOnce).to.be.true;
  });

  it(`should call _addFetchListener() when Router() is called with handleFetch: false`, function() {
    const _addFetchListener = sinon.spy(Router.prototype, '_addFetchListener');
    globalStubs.push(_addFetchListener);

    new Router({handleFetch: false});
    expect(_addFetchListener.calledOnce).to.be.false;
  });

  it(`should modify the internal arrays of routes when register/unregister is called`, function() {
    const router = new Router();

    // Routes without an explicit method will default to GET.
    const getRoute1 = new Route({match: MATCH, handler: HANDLER});
    const getRoute2 = new Route({match: MATCH, handler: HANDLER, method: 'GET'});
    const putRoute1 = new Route({match: MATCH, handler: HANDLER, method: 'PUT'});
    const putRoute2 = new Route({match: MATCH, handler: HANDLER, method: 'PUT'});

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

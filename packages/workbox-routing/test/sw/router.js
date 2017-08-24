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

  // addEventListener is defined on the EventTarget interface.
  // In order to properly stub out the method without triggering mocha's
  // global leak detection, we need to walk up the inheritance chain to
  // from ServiceWorkerGlobalScope to EventTarget.
  // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  it(`should call self.addEventListener('fetch') when addFetchListener() is called`, function() {
    const stub = sinon.stub(self.__proto__.__proto__.__proto__, 'addEventListener');
    globalStubs.push(stub);

    const router = new Router();
    router.addFetchListener();

    expect(stub.calledOnce).to.be.true;
    expect(stub.firstCall.args[0]).to.eql('fetch');
  });

  it(`should return false when addFetchListener() is called multiple times`, function() {
    const stub = sinon.stub(self.__proto__.__proto__.__proto__, 'addEventListener');
    globalStubs.push(stub);

    const router = new Router();
    const firstResponse = router.addFetchListener();
    expect(firstResponse).to.be.true;

    const secondResponse = router.addFetchListener();
    expect(secondResponse).to.be.false;
  });

  it(`should return a promise for the correct response when handleRequest() is called`, async function() {
    const expectedText = 'testing';
    const router = new Router();
    const route = new Route({
      match: () => true,
      handler: () => new Response(expectedText),
    });
    router.registerRoute({route});

    // route.match() always returns true, so the Request details don't matter.
    const event = new FetchEvent('fetch', {request: new Request('/')});
    const response = await router.handleRequest({event});
    const responseBody = await response.text();

    expect(responseBody).to.eql(expectedText);
  });
});

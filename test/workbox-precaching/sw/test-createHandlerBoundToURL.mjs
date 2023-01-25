/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';
import {spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

import {createHandlerBoundToURL} from 'workbox-precaching/createHandlerBoundToURL.mjs';
import {precache} from 'workbox-precaching/precache.mjs';

describe(`createHandlerBoundToURL()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.stub(self, 'addEventListener');
    resetDefaultPrecacheController();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`should throw when passed a URL that isn't precached`, function () {
    precache([]);

    return expectError(
      () => {
        createHandlerBoundToURL('/does-not-exist');
      },
      'non-precached-url',
      (error) => expect(error.details.url).to.eql('/does-not-exist'),
    );
  });

  it(`should return the expected handlerCallback for precached URLs`, async function () {
    // Simulate the following: first two handlerCallbacks have cache.match()
    // calls that return a hit. Third, and subsequent handlerCallback has a
    // cache.match() call that's a miss, which will lead to a call to fetch().
    const matchStub = sandbox
      .stub(self.caches, 'match')
      .onFirstCall()
      .resolves(new Response('response 1'))
      .onSecondCall()
      .resolves(new Response('response 2'))
      .resolves(undefined);

    const fetchStub = sandbox
      .stub(self, 'fetch')
      .onFirstCall()
      .resolves(new Response('response 3'))
      .onSecondCall()
      .resolves(new Response('response 4'));

    precache([
      '/url1',
      {url: '/url2', revision: 'abc123'},
      '/url3',
      {url: '/url4', revision: 'def456'},
    ]);

    const event = new ExtendableEvent('fetch');
    spyOnEvent(event);

    const handler1 = createHandlerBoundToURL('/url1');
    const response1 = await handler1({event});

    expect(matchStub.calledOnce).to.be.true;
    expect(matchStub.firstCall.args[0].url).to.eql(`${location.origin}/url1`);
    expect(fetchStub.notCalled).to.be.true;
    expect(await response1.text()).to.eql('response 1');

    const handler2 = createHandlerBoundToURL('/url2');
    const response2 = await handler2({event});

    expect(matchStub.calledTwice).to.be.true;
    expect(matchStub.secondCall.args[0].url).to.eql(
      `${location.origin}/url2?__WB_REVISION__=abc123`,
    );
    expect(fetchStub.notCalled).to.be.true;
    expect(await response2.text()).to.eql('response 2');

    const handler3 = createHandlerBoundToURL('/url3');
    const response3 = await handler3({event});

    expect(matchStub.calledThrice).to.be.true;
    expect(matchStub.thirdCall.args[0].url).to.eql(`${location.origin}/url3`);
    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.firstCall.args[0].url).to.eql(`${location.origin}/url3`);
    expect(await response3.text()).to.eql('response 3');

    const handler4 = createHandlerBoundToURL('/url4');
    const response4 = await handler4({event});

    expect(matchStub.callCount).to.eql(4);
    // Call #3 is the fourth call due to zero-indexing.
    expect(matchStub.getCall(3).args[0].url).to.eql(
      `${location.origin}/url4?__WB_REVISION__=def456`,
    );
    expect(fetchStub.calledTwice).to.be.true;
    expect(fetchStub.secondCall.args[0].url).to.eql(`${location.origin}/url4`);
    expect(await response4.text()).to.eql('response 4');
  });
});

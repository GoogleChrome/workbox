/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {matchPrecache} from 'workbox-precaching/matchPrecache.mjs';
import {precache} from 'workbox-precaching/precache.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';

describe(`matchPrecache()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.stub(self, 'addEventListener');
    resetDefaultPrecacheController();
  });

  afterEach(function () {
    sandbox.restore();
  });

  // This is all into one big test with multiple expects() as that plays nicer
  // with precache()'s behavior.
  it(`should behave as expected`, async function () {
    const matchStub = sandbox
      .stub()
      .onFirstCall()
      .resolves(new Response('response 1'))
      .onSecondCall()
      .resolves(new Response('response 2'))
      .resolves(undefined);

    sandbox.stub(self.caches, 'open').resolves({
      match: matchStub,
    });

    precache(['/url1', {url: '/url2', revision: 'abc123'}]);

    const noMatchResponse = await matchPrecache('does-not-match');
    expect(noMatchResponse).to.be.undefined;
    expect(matchStub.notCalled).to.be.true;

    const response1 = await matchPrecache('/url1');

    expect(matchStub.calledOnce).to.be.true;
    expect(matchStub.firstCall.args).to.eql([`${location.origin}/url1`]);
    expect(await response1.text()).to.eql('response 1');

    const response2 = await matchPrecache(new Request('/url2'));

    expect(matchStub.calledTwice).to.be.true;
    expect(matchStub.secondCall.args).to.eql([
      `${location.origin}/url2?__WB_REVISION__=abc123`,
    ]);
    expect(await response2.text()).to.eql('response 2');
  });
});

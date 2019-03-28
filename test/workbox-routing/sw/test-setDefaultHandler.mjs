/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import clearRequire from 'clear-require';
import sinon from 'sinon';

describe(`[workbox-routing] setDefaultHandler()`, function() {
  const sandbox = sinon.createSandbox();

  let setDefaultHandler;
  let Router;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-routing/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-routing'));

    setDefaultHandler = (await import(`${basePath}setDefaultHandler.mjs`)).setDefaultHandler;
    Router = (await import(`${basePath}Router.mjs`)).Router;
  });

  after(function() {
    sandbox.restore();
  });

  it(`should call setDefaultHandler() on the default router`, function() {
    sandbox.spy(Router.prototype, 'setDefaultHandler');

    const handler = () => new Response('');

    setDefaultHandler(handler);

    expect(Router.prototype.setDefaultHandler.calledOnceWith(handler)).to.be.true;
  });
});

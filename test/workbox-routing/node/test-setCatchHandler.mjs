/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import clearRequire from 'clear-require';
import sinon from 'sinon';

describe(`[workbox-routing] setCatchHandler()`, function() {
  const sandbox = sinon.createSandbox();

  let setCatchHandler;
  let Router;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-routing/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-routing'));

    setCatchHandler = (await import(`${basePath}setCatchHandler.mjs`)).setCatchHandler;
    Router = (await import(`${basePath}Router.mjs`)).Router;
  });

  after(function() {
    sandbox.restore();
  });

  it(`should call setCatchHandler() on the default router`, function() {
    sandbox.spy(Router.prototype, 'setCatchHandler');

    const handler = () => new Response('');

    setCatchHandler(handler);

    expect(Router.prototype.setCatchHandler.calledOnceWith(handler)).to.be.true;
  });
});

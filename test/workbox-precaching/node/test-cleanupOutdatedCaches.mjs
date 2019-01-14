/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';


describe(`[workbox-precaching] default export`, function() {
  const sandbox = sinon.createSandbox();
  let cleanupOutdatedCaches;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-precaching/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-precaching'));
    cleanupOutdatedCaches = (await import(`${basePath}cleanupOutdatedCaches.mjs`)).cleanupOutdatedCaches;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`cleanupOutdatedCaches()`, function() {
    it(`should add an activate listener`, async function() {
      const addEventListenerSpy = sandbox.spy(self, 'addEventListener');
      cleanupOutdatedCaches();

      expect(addEventListenerSpy.calledOnce).to.be.true;
      expect(addEventListenerSpy.firstCall.args[0]).to.eql('activate');
    });
  });
});

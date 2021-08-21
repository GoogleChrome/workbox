/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cleanupOutdatedCaches} from 'workbox-precaching/cleanupOutdatedCaches.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';

describe(`cleanupOutdatedCaches()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
    resetDefaultPrecacheController();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`should add an activate listener`, async function () {
    const addEventListenerSpy = sandbox.spy(self, 'addEventListener');
    cleanupOutdatedCaches();

    expect(addEventListenerSpy.calledOnce).to.be.true;
    expect(addEventListenerSpy.firstCall.args[0]).to.eql('activate');
  });
});

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {addPlugins} from 'workbox-precaching/addPlugins.mjs';
import {precache} from 'workbox-precaching/precache.mjs';
import {PrecacheController} from 'workbox-precaching/PrecacheController.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';
import {dispatchAndWaitUntilDone} from '../../../infra/testing/helpers/extendable-event-utils.mjs';


describe(`addPlugins()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
    resetDefaultPrecacheController();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');
  });

  afterEach(function() {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should add plugins during install`, async function() {
    sandbox.spy(PrecacheController.prototype, 'install');
    sandbox.stub(Cache.prototype, 'keys').returns([]);

    const plugin1 = {handlerWillStart: sandbox.spy()};
    const plugin2 = {handlerWillStart: sandbox.spy()};

    precache([{url: '/', revision: null}]);
    addPlugins([plugin1]);
    addPlugins([plugin2]);

    await dispatchAndWaitUntilDone(new ExtendableEvent('install'));

    expect(plugin1.handlerWillStart.callCount).to.equal(1);
    expect(plugin2.handlerWillStart.callCount).to.equal(1);
  });
});

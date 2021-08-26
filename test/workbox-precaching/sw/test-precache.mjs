/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {precache} from 'workbox-precaching/precache.mjs';
import {PrecacheController} from 'workbox-precaching/PrecacheController.mjs';
import {getOrCreatePrecacheController} from 'workbox-precaching/utils/getOrCreatePrecacheController.mjs';
import {resetDefaultPrecacheController} from './resetDefaultPrecacheController.mjs';
import {dispatchAndWaitUntilDone} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

describe(`precache()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
    resetDefaultPrecacheController();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');
  });

  // The `addFetchListener` method adds a listener only the first time it's invoked,
  // so we can't remove that listener until all tests are run.
  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  it(`should call install and activate on install and activate`, async function () {
    const pc = getOrCreatePrecacheController();

    sandbox.spy(pc, 'install');
    sandbox.spy(pc, 'activate');

    precache(['/']);

    await dispatchAndWaitUntilDone(new ExtendableEvent('install'));

    expect(pc.install.callCount).to.equal(1);
    expect(pc.activate.callCount).to.equal(0);

    await dispatchAndWaitUntilDone(new ExtendableEvent('activate'));

    expect(pc.install.callCount).to.equal(1);
    expect(pc.activate.callCount).to.equal(1);
  });

  it(`should add entries to the default PrecacheController cache list`, async function () {
    sandbox.spy(PrecacheController.prototype, 'addToCacheList');

    precache(['/one', '/two', '/three']);

    expect(PrecacheController.prototype.addToCacheList.callCount).to.equal(1);
    expect(
      PrecacheController.prototype.addToCacheList.args[0][0],
    ).to.deep.equal(['/one', '/two', '/three']);
  });

  it(`shouldn't throw when precaching assets`, function () {
    precache([
      'index.1234.html',
      {
        url: 'test.1234.html',
      },
      {
        url: 'testing.html',
        revision: '1234',
      },
    ]);
  });
});

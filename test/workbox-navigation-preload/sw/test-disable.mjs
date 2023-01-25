/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {disable} from 'workbox-navigation-preload/disable.mjs';
import {isSupported} from 'workbox-navigation-preload/isSupported.mjs';
import {dispatchAndWaitUntilDone} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

describe(`disable`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    if (isSupported()) {
      // Don't actually disable navigation preload.
      sandbox.stub(self.registration.navigationPreload, 'disable').resolves();
    }
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }
    sandbox.restore();
  });

  // This is needed because we're skipping the last test, which for some
  // reasons seems to be skipping the afterEach hook:
  // https://github.com/mochajs/mocha/pull/2571#issuecomment-477407091
  after(function () {
    sandbox.restore();
  });

  it(`should call addEventListener iff navigation preload is supported`, async function () {
    disable();

    if (isSupported()) {
      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('activate');
    } else {
      expect(self.addEventListener.callCount).to.equal(0);
    }
  });

  it(`should disable navigation preload if supported`, async function () {
    if (!isSupported()) this.skip();

    disable();

    await dispatchAndWaitUntilDone(new ExtendableEvent('activate'));

    // This method is stubbed in the beforeEach hook.
    expect(self.registration.navigationPreload.disable.callCount).to.equal(1);
  });

  it(`should log a confirmation message in development`, async function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.spy(logger, 'log');

    disable();

    await dispatchAndWaitUntilDone(new ExtendableEvent('activate'));

    expect(logger.log.callCount).to.equal(1);
    if (isSupported()) {
      expect(logger.log.args[0][0]).to.match(/disabled/);
    } else {
      expect(logger.log.args[0][0]).to.match(/not supported/);
    }
  });
});

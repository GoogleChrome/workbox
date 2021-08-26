/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {enable} from 'workbox-navigation-preload/enable.mjs';
import {isSupported} from 'workbox-navigation-preload/isSupported.mjs';
import {dispatchAndWaitUntilDone} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

describe(`enable`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    if (isSupported()) {
      // Don't actually enable navigation preload.
      sandbox.stub(self.registration.navigationPreload, 'enable').resolves();
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
    enable();

    if (isSupported()) {
      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('activate');
    } else {
      expect(self.addEventListener.callCount).to.equal(0);
    }
  });

  it(`should enable navigation preload if supported`, async function () {
    if (!isSupported()) this.skip();

    enable();

    await dispatchAndWaitUntilDone(new ExtendableEvent('activate'));

    // This method is stubbed in the beforeEach hook.
    expect(self.registration.navigationPreload.enable.callCount).to.equal(1);
  });

  it(`should use a custom header value if specified`, async function () {
    if (!isSupported()) this.skip();

    sandbox.spy(self.registration.navigationPreload, 'setHeaderValue');

    enable('custom-header');

    await dispatchAndWaitUntilDone(new ExtendableEvent('activate'));

    expect(
      self.registration.navigationPreload.setHeaderValue.callCount,
    ).to.equal(1);
    expect(
      self.registration.navigationPreload.setHeaderValue.args[0][0],
    ).to.equal('custom-header');
  });

  it(`should log a confirmation message in development`, async function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.spy(logger, 'log');

    enable();

    await dispatchAndWaitUntilDone(new ExtendableEvent('activate'));

    expect(logger.log.callCount).to.equal(1);
    if (isSupported()) {
      expect(logger.log.args[0][0]).to.match(/enabled/);
    } else {
      expect(logger.log.args[0][0]).to.match(/not supported/);
    }
  });
});

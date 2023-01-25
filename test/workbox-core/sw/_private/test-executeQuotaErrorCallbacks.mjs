/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {executeQuotaErrorCallbacks} from 'workbox-core/_private/executeQuotaErrorCallbacks.mjs';
import {registerQuotaErrorCallback} from 'workbox-core/registerQuotaErrorCallback.mjs';

describe(`executeQuotaErrorCallbacks()`, function () {
  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
  });

  it('should call everything registered with registerQuotaErrorCallback()', async function () {
    const callback1 = sandbox.stub();
    registerQuotaErrorCallback(callback1);
    const callback2 = sandbox.stub();
    registerQuotaErrorCallback(callback2);

    await executeQuotaErrorCallbacks();

    expect(callback1.calledOnce).to.be.true;
    expect(callback2.calledOnce).to.be.true;
  });

  it(`shouldn't have any effect if called multiple times with the same callback`, async function () {
    const callback1 = sandbox.stub();
    registerQuotaErrorCallback(callback1);
    registerQuotaErrorCallback(callback1);
    registerQuotaErrorCallback(callback1);

    await executeQuotaErrorCallbacks();

    expect(callback1.calledOnce).to.be.true;
  });

  it(`should call everything registered with registerQuotaErrorCallback(), each time it's called`, async function () {
    const callback1 = sandbox.stub();
    registerQuotaErrorCallback(callback1);
    const callback2 = sandbox.stub();
    registerQuotaErrorCallback(callback2);

    await executeQuotaErrorCallbacks();
    await executeQuotaErrorCallbacks();

    expect(callback1.calledTwice).to.be.true;
    expect(callback2.calledTwice).to.be.true;
  });
});

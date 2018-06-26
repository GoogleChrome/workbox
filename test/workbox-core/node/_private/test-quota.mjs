import {expect} from 'chai';
import sinon from 'sinon';

import expectError from '../../../../infra/testing/expectError';
import {executeQuotaErrorCallbacks, registerQuotaErrorCallback} from '../../../../packages/workbox-core/_private/quota.mjs';
import {devOnly} from '../../../../infra/testing/env-it';

describe(`workbox-core quota`, function() {
  describe(`registerQuotaErrorCallback()`, function() {
    devOnly.it(`should throw when passed a non-function`, async function() {
      await expectError(() => registerQuotaErrorCallback(null), 'incorrect-type');
    });
  });

  describe(`executeQuotaErrorCallbacks()`, function() {
    let sandbox;

    before(function() {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      sandbox.restore();
    });
    it('should call everything registered with registerQuotaErrorCallback()', async function() {
      const callback1 = sandbox.stub();
      registerQuotaErrorCallback(callback1);
      const callback2 = sandbox.stub();
      registerQuotaErrorCallback(callback2);

      await executeQuotaErrorCallbacks();

      expect(callback1.calledOnce).to.be.true;
      expect(callback2.calledOnce).to.be.true;
    });

    it(`shouldn't have any effect if called multiple times with the same callback`, async function() {
      const callback1 = sandbox.stub();
      registerQuotaErrorCallback(callback1);
      registerQuotaErrorCallback(callback1);
      registerQuotaErrorCallback(callback1);

      await executeQuotaErrorCallbacks();

      expect(callback1.calledOnce).to.be.true;
    });

    it(`should call everything registered with registerQuotaErrorCallback(), each time it's called`, async function() {
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
});

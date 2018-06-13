import {expect} from 'chai';
import sinon from 'sinon';

import expectError from '../../../../infra/testing/expectError';
import {executeCallbacks, registerCallback} from '../../../../packages/workbox-core/_private/quota.mjs';
import {devOnly} from '../../../../infra/testing/env-it';

describe(`workbox-core quota`, function() {
  describe(`registerCallback()`, function() {
    devOnly.it(`should throw when passed a non-function`, async function() {
      await expectError(() => registerCallback(null), 'incorrect-type');
    });
  });

  describe(`executeCallbacks()`, function() {
    let sandbox;

    before(function() {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      sandbox.restore();
    });
    it('should call everything registered with registerCallback()', async function() {
      const callback1 = sandbox.stub();
      registerCallback(callback1);
      const callback2 = sandbox.stub();
      registerCallback(callback2);

      await executeCallbacks();

      expect(callback1.calledOnce).to.be.true;
      expect(callback2.calledOnce).to.be.true;
    });

    it(`shouldn't have any effect if called multiple times with the same callback`, async function() {
      const callback1 = sandbox.stub();
      registerCallback(callback1);
      registerCallback(callback1);
      registerCallback(callback1);

      await executeCallbacks();

      expect(callback1.calledOnce).to.be.true;
    });

    it(`should call everything registered with registerCallback(), each time it's called`, async function() {
      const callback1 = sandbox.stub();
      registerCallback(callback1);
      const callback2 = sandbox.stub();
      registerCallback(callback2);

      await executeCallbacks();
      await executeCallbacks();

      expect(callback1.calledTwice).to.be.true;
      expect(callback2.calledTwice).to.be.true;
    });
  });
});

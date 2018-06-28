import {expect} from 'chai';
import clearRequire from 'clear-require';
import sinon from 'sinon';

describe(`[workbox-navigation-preload] enable`, function() {
  const originalSelf = global.self;
  const MODULE_ID = '../../../packages/workbox-navigation-preload/enable.mjs';

  afterEach(function() {
    clearRequire(MODULE_ID);
    global.self = originalSelf;
  });

  it(`should not call addEventListener when navigation preload isn't supported`, async function() {
    global.self = {
      addEventListener: sinon.stub(),
    };

    const {enable} = await import(MODULE_ID);
    enable();

    expect(global.self.addEventListener.called).to.be.false;
  });

  it(`should call addEventListener when navigation preload is supported`, async function() {
    global.self = {
      addEventListener: sinon.stub(),
      registration: {
        navigationPreload: {},
      },
    };

    const {enable} = await import(MODULE_ID);
    enable();

    expect(global.self.addEventListener.calledOnce).to.be.true;
  });
});

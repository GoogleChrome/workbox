import {expect} from 'chai';
import clearRequire from 'clear-require';

describe(`[workbox-navigation-preload] utils/isSupported`, function() {
  const originalSelf = global.self;
  const MODULE_ID = '../../../../packages/workbox-navigation-preload/utils/isSupported.mjs';

  afterEach(function() {
    clearRequire(MODULE_ID);
    global.self = originalSelf;
  });

  it(`should return 'false' when self.registration is undefined`, async function() {
    global.self = {};
    const {isSupported} = await import(MODULE_ID);
    expect(isSupported()).to.be.false;
  });

  it(`should return 'false' when self.registration.navigationPreload is undefined`, async function() {
    global.self = {
      registration: {},
    };
    const {isSupported} = await import(MODULE_ID);
    expect(isSupported()).to.be.false;
  });

  it(`should return 'true' when self.registration.navigationPreload is defined`, async function() {
    global.self = {
      registration: {
        navigationPreload: {},
      },
    };
    const {isSupported} = await import(MODULE_ID);
    expect(isSupported()).to.be.true;
  });
});

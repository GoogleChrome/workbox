import sinon from 'sinon';
import {expect} from 'chai';

import {devOnly} from '../../../../infra/testing/env-it';
import printInstallDetails from '../../../../packages/workbox-precaching/utils/printInstallDetails.mjs';
import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';

describe(`[workbox-precaching] printInstallDetails`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();

    sandbox.spy(console, 'log');
    sandbox.stub(console, 'debug');
    sandbox.stub(console, 'warn');
    sandbox.stub(console, 'groupCollapsed');
    sandbox.stub(console, 'groupEnd');
  });

  after(function() {
    sandbox.restore();
  });

  devOnly.it(`should print with single update`, function() {
    const precacheEntry = new PrecacheEntry({url: '/'}, '/', '/', false);
    printInstallDetails([], [precacheEntry]);

    expect(console.log.callCount).to.equal(1);
  });
});

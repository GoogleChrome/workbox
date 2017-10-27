import sinon from 'sinon';
import {expect} from 'chai';

import {devOnly} from '../../../../infra/testing/env-it';
import logger from '../../../../packages/workbox-core/_private/logger.mjs';
import printInstallDetails from '../../../../packages/workbox-precaching/utils/printInstallDetails.mjs';
import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';

describe(`[workbox-precaching] printInstallDetails`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  devOnly.it(`should print with single update`, function() {
    const precacheEntry = new PrecacheEntry({url: '/'}, '/', '/', false);
    printInstallDetails([], [precacheEntry]);

    expect(logger.log.callCount).to.equal(1);
  });
});

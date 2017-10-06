import sinon from 'sinon';
import {expect} from 'chai';

import logger from '../../../../packages/workbox-core/utils/logger.mjs';
import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';
import showWarningsIfNeeded from '../../../../packages/workbox-precaching/utils/showWarningsIfNeeded.mjs';

describe(`[workbox-precaching] showWarningsIfNeeded`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();

    sandbox.stub(logger, 'log');
    sandbox.stub(logger, 'debug');
    sandbox.stub(logger, 'warn');
    sandbox.stub(logger, 'groupCollapsed');
    sandbox.stub(logger, 'groupEnd');
  });

  after(function() {
    sandbox.restore();
  });

  it(`shouldn't print anything if all entries have revision`, function() {
    const precacheEntry = new PrecacheEntry({url: '/', revision: '123'}, '/', '123', true);

    const entriesMap = new Map();
    entriesMap.set(precacheEntry._entryId, precacheEntry);

    showWarningsIfNeeded(entriesMap);

    expect(logger.log.callCount).to.equal(0);
  });

  it(`should print if any of the entries have no revision`, function() {
    const precacheEntry = new PrecacheEntry({url: '/'}, '/', '/', false);

    const entriesMap = new Map();
    entriesMap.set(precacheEntry._entryId, precacheEntry);

    showWarningsIfNeeded(entriesMap);

    expect(logger.log.callCount).to.be.gt(0);
  });
});

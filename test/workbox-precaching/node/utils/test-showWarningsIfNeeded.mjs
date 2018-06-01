import sinon from 'sinon';
import {expect} from 'chai';

import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';
import showWarningsIfNeeded from '../../../../packages/workbox-precaching/utils/showWarningsIfNeeded.mjs';
import {logger} from '../../../../packages/workbox-core/_private/logger.mjs';

describe(`[workbox-precaching] showWarningsIfNeeded`, function() {
  let sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
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

  it(`should print as the entry has no revision`, function() {
    const precacheEntry = new PrecacheEntry({url: '/'}, '/', '/', false);

    const entriesMap = new Map();
    entriesMap.set(precacheEntry._entryId, precacheEntry);

    showWarningsIfNeeded(entriesMap);

    expect(logger.warn.callCount).to.be.gt(0);
  });
});

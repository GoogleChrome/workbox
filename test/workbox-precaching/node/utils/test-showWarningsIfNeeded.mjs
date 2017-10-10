import sinon from 'sinon';
import {expect} from 'chai';

import constants from '../../../../gulp-tasks/utils/constants';
import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';
import showWarningsIfNeeded from '../../../../packages/workbox-precaching/utils/showWarningsIfNeeded.mjs';

describe(`[workbox-precaching] showWarningsIfNeeded`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();

    sandbox.stub(console, 'log');
    sandbox.stub(console, 'debug');
    sandbox.stub(console, 'warn');
    sandbox.stub(console, 'groupCollapsed');
    sandbox.stub(console, 'groupEnd');
  });

  after(function() {
    sandbox.restore();
  });

  it(`shouldn't print anything if all entries have revision`, function() {
    const precacheEntry = new PrecacheEntry({url: '/', revision: '123'}, '/', '123', true);

    const entriesMap = new Map();
    entriesMap.set(precacheEntry._entryId, precacheEntry);

    showWarningsIfNeeded(entriesMap);

    expect(console.log.callCount).to.equal(0);
  });

  it(`should print as the entry has no revision`, function() {
    const precacheEntry = new PrecacheEntry({url: '/'}, '/', '/', false);

    const entriesMap = new Map();
    entriesMap.set(precacheEntry._entryId, precacheEntry);

    showWarningsIfNeeded(entriesMap);

    if (process.env.NODE_ENV === constants.BUILD_TYPES.prod) {
      expect(console.log.callCount).to.equal(0);
    } else {
      expect(console.log.callCount).to.be.gt(0);
    }
  });
});

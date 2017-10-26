import sinon from 'sinon';
import {expect} from 'chai';

import {devOnly} from '../../../../infra/testing/env-it';
import {logger} from '../../../../packages/workbox-core/_private/logger.mjs';
import printCleanupDetails from '../../../../packages/workbox-precaching/utils/printCleanupDetails.mjs';

describe(`[workbox-precaching] printCleanupDetails`, function() {
  let sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  it(`shouldn't print if nothing was deleted`, function() {
    printCleanupDetails([], []);

    expect(logger.log.callCount).to.equal(0);
  });

  devOnly.it(`should print at least one entry was delete`, function() {
    printCleanupDetails(['/'], ['/']);

    expect(logger.log.callCount).to.be.gt(0);
  });

  devOnly.it(`should print strings with multiple entries`, function() {
    printCleanupDetails(['/', '/2'], ['/', '/2']);

    expect(logger.log.callCount).to.be.gt(0);
  });
});

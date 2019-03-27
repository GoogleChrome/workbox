/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';

import {devOnly} from '../../../../infra/testing/env-it';
import {logger} from '../../../../packages/workbox-core/_private/logger.mjs';
import {printInstallDetails} from '../../../../packages/workbox-precaching/utils/printInstallDetails.mjs';

describe(`[workbox-precaching] printInstallDetails`, function() {
  let sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  devOnly.it(`should print with single update`, function() {
    printInstallDetails([], ['/index.html']);

    expect(logger.log.callCount).to.equal(1);
  });
});

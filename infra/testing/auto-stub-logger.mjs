/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {logger} from '../../packages/workbox-core/_private/logger.mjs';

const sandbox = sinon.createSandbox();
const stubLogger = () => {
  // Logger will be `null` in production mode.
  if (logger) {
    sandbox.stub(logger);
  }
};

// Silence any early messages (Normally caused by logging from an import at
// the top of a test)
stubLogger();

// This is part of the "root" mocha suite - meaning it'll reset all the logger
// values before every test.
beforeEach(function () {
  sandbox.restore();

  stubLogger();
});

after(function () {
  sandbox.restore();
});

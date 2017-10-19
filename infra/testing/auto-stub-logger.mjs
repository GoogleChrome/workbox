import sinon from 'sinon';
import logger from '../../packages/workbox-core/utils/logger.mjs';

const sandbox = sinon.sandbox.create();

const stubLogger = () => {
  sandbox.stub(logger);
  sandbox.stub(logger.unprefixed);
};

// Silence any early messages (Normally caused by logging from an import at
// the top of a test)
stubLogger();

// This is part of the "root" mocha suite - meaning it'll reset all the logger
// values before every test.
beforeEach(function() {
  sandbox.restore();

  stubLogger();
});

after(function() {
  sandbox.restore();
});

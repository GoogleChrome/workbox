import sinon from 'sinon';
import logger from '../../packages/workbox-core/utils/logger.mjs';

const sandbox = sinon.sandbox.create();

// This is part of the "root" mocha suite - meaning it'll reset all the logger
// values before every test.
beforeEach(function() {
  sandbox.restore();

  sandbox.stub(logger, 'debug');
  sandbox.stub(logger, 'log');
  sandbox.stub(logger, 'warn');
  sandbox.stub(logger, 'error');
  sandbox.stub(logger, 'groupCollapsed');
  sandbox.stub(logger, 'groupEnd');
});

after(function() {
  sandbox.restore();
});

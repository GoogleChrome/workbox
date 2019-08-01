/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';


describe(`logger`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();

    // Undo the logger stubs setup in infra/testing/auto-stub-logger.mjs
    // But do this conditionally as logger will be `null` in production node.
    if (logger) {
      Object.keys(logger).forEach((key) => {
        if (logger[key].restore) {
          logger[key].restore();
        }
      });
    }
  });

  after(function() {
    sandbox.restore();
  });

  const consoleLevels = [
    'debug',
    'log',
    'warn',
    'error',
  ];

  const validateStub = (stub, expectedArgs, isPrefixed) => {
    expect(stub.callCount).to.equal(1);

    const calledArgs = stub.args[0];
    // 'workbox' is our prefix and '%c' enables styling in the console.
    if (isPrefixed) {
      const prefix = calledArgs.splice(0, 2);

      expect(prefix[0]).to.equal('%cworkbox');
    }

    expect(calledArgs).to.deep.equal(expectedArgs);
  };

  it(`should be null in production mode`, function() {
    if (process.env.NODE_ENV !== 'production') this.skip();

    expect(logger).to.equal(null);
  });

  consoleLevels.forEach((consoleLevel) => {
    describe(`.${consoleLevel}()`, function() {
      it(`should work without input`, function() {
        if (process.env.NODE_ENV === 'production') this.skip();

        const stub = sandbox.stub(console, consoleLevel);

        logger[consoleLevel]();

        // Restore so mocha tests can properly log.
        sandbox.restore();

        validateStub(stub, [], true);
      });

      it(`should work with several inputs`, function() {
        if (process.env.NODE_ENV === 'production') this.skip();

        const stub = sandbox.stub(console, consoleLevel);

        const args = ['', 'test', null, undefined, [], {}];
        logger[consoleLevel](...args);

        // Restore so mocha tests can properly log.
        sandbox.restore();

        validateStub(stub, args, true);
      });
    });
  });

  describe(`.groupCollapsed()`, function() {
    it(`should work without input`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const stub = sandbox.stub(console, 'groupCollapsed');
      sandbox.stub(console, 'groupEnd');

      logger.groupCollapsed();
      logger.groupEnd();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
    });

    // TODO: https://github.com/GoogleChrome/workbox/issues/2149
    it.skip(`should work with several inputs`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const stub = sandbox.stub(console, 'groupCollapsed');
      sandbox.stub(console, 'groupEnd');

      const args = ['', 'test', null, undefined, [], {}];
      logger.groupCollapsed(...args);
      logger.groupEnd();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      validateStub(stub, args, true);
    });

    // TODO: https://github.com/GoogleChrome/workbox/issues/2149
    it.skip(`should not prefix log message until after .groupEnd() is called`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const debugStub = sandbox.stub(console, 'debug');
      const logStub = sandbox.stub(console, 'log');
      const warnStub = sandbox.stub(console, 'warn');
      const errorStub = sandbox.stub(console, 'error');
      sandbox.stub(console, 'groupCollapsed');
      sandbox.stub(console, 'groupEnd');

      logger.groupCollapsed();
      logger.debug();
      logger.log();
      logger.warn();
      logger.error();
      logger.groupEnd();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      validateStub(debugStub, [], false);
      validateStub(logStub, [], false);
      validateStub(warnStub, [], false);
      validateStub(errorStub, [], false);

      // After `groupEnd()`, subsequent logs should be prefixed again.
      const logStub2 = sandbox.stub(console, 'log');

      logger.log();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      validateStub(logStub2, [], true);
    });
  });

  describe(`.groupEnd()`, function() {
    it(`should work without input`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      const stub = sandbox.stub(console, 'groupEnd');

      logger.groupEnd();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
    });
  });
});

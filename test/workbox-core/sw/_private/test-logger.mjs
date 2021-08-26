/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';

describe(`logger`, function () {
  const SAFARI_USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15`;
  const CHROME_USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.87 Safari/537.36`;

  const sandbox = sinon.createSandbox();

  beforeEach(function () {
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

    self.__WB_DISABLE_DEV_LOGS = false;
  });

  after(function () {
    sandbox.restore();
  });

  const consoleLevels = ['debug', 'log', 'warn', 'error'];

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

  it(`should be null in production mode`, function () {
    if (process.env.NODE_ENV !== 'production') this.skip();

    expect(logger).to.equal(null);
  });

  it(`should toggle logging based on the value of __WB_DISABLE_DEV_LOGS`, function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    const logStub = sandbox.stub(console, 'log');

    self.__WB_DISABLE_DEV_LOGS = true;
    logger.log('');
    expect(logStub.callCount).to.eql(0);

    self.__WB_DISABLE_DEV_LOGS = false;
    logger.log('');
    expect(logStub.callCount).to.eql(1);
  });

  consoleLevels.forEach((consoleLevel) => {
    describe(`.${consoleLevel}()`, function () {
      it(`should work without input`, function () {
        if (process.env.NODE_ENV === 'production') this.skip();

        const stub = sandbox.stub(console, consoleLevel);

        logger[consoleLevel]();

        // Restore so mocha tests can properly log.
        sandbox.restore();

        validateStub(stub, [], true);
      });

      it(`should work with several inputs`, function () {
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

  describe(`.groupCollapsed()`, function () {
    it(`should work without input`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      const stub = sandbox.stub(console, 'groupCollapsed');
      sandbox.stub(console, 'groupEnd');

      logger.groupCollapsed();
      logger.groupEnd();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
    });

    // There's User-Agent sniffing in the logger code, so we need to run
    // two different test scenarios for Safari and non-Safari browsers.
    // See https://github.com/GoogleChrome/workbox/issues/2149
    for (const [userAgent, isPrefixed] of new Map([
      [SAFARI_USER_AGENT, false],
      [CHROME_USER_AGENT, true],
    ])) {
      it(`should work with several inputs (for ${userAgent})`, function () {
        if (process.env.NODE_ENV === 'production') this.skip();

        const stub = sandbox.stub(console, 'groupCollapsed');
        sandbox.replaceGetter(navigator, 'userAgent', () => userAgent);
        sandbox.stub(console, 'groupEnd');

        const args = ['', 'test', null, undefined, [], {}];
        logger.groupCollapsed(...args);
        logger.groupEnd();

        // Restore so mocha tests can properly log.
        sandbox.restore();

        validateStub(stub, args, isPrefixed);
      });

      it(`should not prefix log message until after .groupEnd() is called (for ${userAgent})`, function () {
        if (process.env.NODE_ENV === 'production') this.skip();

        sandbox.replaceGetter(navigator, 'userAgent', () => userAgent);

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

        validateStub(debugStub, [], !isPrefixed);
        validateStub(logStub, [], !isPrefixed);
        validateStub(warnStub, [], !isPrefixed);
        validateStub(errorStub, [], !isPrefixed);

        // After `groupEnd()`, subsequent logs should be prefixed again.
        const logStub2 = sandbox.stub(console, 'log');

        logger.log();

        // Restore so mocha tests can properly log.
        sandbox.restore();

        validateStub(logStub2, [], true);
      });
    }
  });

  describe(`.groupEnd()`, function () {
    it(`should work without input`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      const stub = sandbox.stub(console, 'groupEnd');

      logger.groupEnd();

      // Restore so mocha tests can properly log.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
    });
  });
});

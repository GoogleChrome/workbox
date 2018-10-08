/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';
import {devOnly, prodOnly} from '../../../../infra/testing/env-it.js';
import LOG_LEVELS from '../../../../packages/workbox-core/models/LogLevels.mjs';
import {logger} from '../../../../packages/workbox-core/_private/logger.mjs';
import {setLoggerLevel, getDefaultLogLevel} from '../../../../packages/workbox-core/_private/logger.mjs';

describe(`workbox-core logger`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    // Reset between runs
    setLoggerLevel(LOG_LEVELS.debug);

    // Undo the logger stubs setup in infra/testing/auto-stub-logger.mjs
    Object.keys(logger).forEach((key) => {
      if (logger[key].restore) {
        logger[key].restore();
      }
    });

    Object.keys(logger.unprefixed).forEach((key) => {
      if (logger.unprefixed[key].restore) {
        logger.unprefixed[key].restore();
      }
    });
  });

  afterEach(function() {
    sandbox.restore();
  });

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

  const groupLogLevel = LOG_LEVELS.error;
  const logDetails = [
    {
      name: 'debug',
      level: LOG_LEVELS.debug,
    }, {
      name: 'log',
      level: LOG_LEVELS.log,
    }, {
      name: 'warn',
      level: LOG_LEVELS.warn,
    }, {
      name: 'error',
      level: LOG_LEVELS.error,
    }, {
      name: 'groupCollapsed',
      level: groupLogLevel,
    },
  ];

  describe(`getLoggerLevel()`, function() {
    devOnly.it(`should initialise to 'log' log level in dev`, async function() {
      expect(getDefaultLogLevel()).to.equal(LOG_LEVELS.log);
    });

    prodOnly.it(`should initialise to 'warn' log level in prod`, async function() {
      expect(getDefaultLogLevel()).to.equal(LOG_LEVELS.warn);
    });
  });

  logDetails.forEach((logDetail) => {
    describe(`.${logDetail.name}()`, function() {
      it('should work without input', function() {
        const stub = sandbox.stub(console, logDetail.name);

        logger[logDetail.name]();

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        validateStub(stub, [], true);
      });

      it(`should work several inputs`, function() {
        const stub = sandbox.stub(console, logDetail.name);

        const args = ['', 'test', null, undefined, [], {}];
        logger[logDetail.name](...args);

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        validateStub(stub, args, true);
      });

      const logLevels = Object.keys(LOG_LEVELS);
      logLevels.forEach((logLevelName) => {
        it(`should behave correctly with ${logLevelName} log level`, function() {
          const stub = sandbox.stub(console, logDetail.name);

          setLoggerLevel(LOG_LEVELS[logLevelName]);
          const args = ['test'];
          logger[logDetail.name](...args);

          // Restore to avoid upsetting mocha logs.
          sandbox.restore();

          if (logDetail.level >= LOG_LEVELS[logLevelName] && logLevelName !== 'silent') {
            validateStub(stub, args, true);
          } else {
            expect(stub.callCount).to.equal(0);
          }
        });
      });
    });

    describe(`.unprefixed.${logDetail.name}()`, function() {
      it('should work without input', function() {
        const stub = sandbox.stub(console, logDetail.name);

        logger.unprefixed[logDetail.name]();

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        validateStub(stub, [], false);
      });

      it(`should work several inputs`, function() {
        const stub = sandbox.stub(console, logDetail.name);

        const args = ['', 'test', null, undefined, [], {}];
        logger.unprefixed[logDetail.name](...args);

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        validateStub(stub, args, false);
      });

      const logLevels = Object.keys(LOG_LEVELS);
      logLevels.forEach((logLevelName) => {
        it(`should behave correctly with ${logLevelName} log level`, function() {
          const stub = sandbox.stub(console, logDetail.name);

          setLoggerLevel(LOG_LEVELS[logLevelName]);
          const args = ['test'];
          logger.unprefixed[logDetail.name](...args);

          // Restore to avoid upsetting mocha logs.
          sandbox.restore();

          if (logDetail.level >= LOG_LEVELS[logLevelName] && logLevelName !== 'silent') {
            validateStub(stub, args, false);
          } else {
            expect(stub.callCount).to.equal(0);
          }
        });
      });
    });
  });

  describe(`.groupEnd()`, function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'groupEnd');

      logger.groupEnd();

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
    });

    const logLevels = Object.keys(LOG_LEVELS);
    logLevels.forEach((logLevelName) => {
      it(`should behave correctly with ${logLevelName} log level`, function() {
        const stub = sandbox.stub(console, 'groupEnd');

        setLoggerLevel(LOG_LEVELS[logLevelName]);
        logger.groupEnd();

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        if (groupLogLevel >= LOG_LEVELS[logLevelName] && logLevelName !== 'silent') {
          expect(stub.callCount).to.equal(1);
        } else {
          expect(stub.callCount).to.equal(0);
        }
      });
    });
  });
});

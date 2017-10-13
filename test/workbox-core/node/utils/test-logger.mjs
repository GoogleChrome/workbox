import {expect} from 'chai';
import sinon from 'sinon';
import LOG_LEVELS from '../../../../packages/workbox-core/models/LogLevels.mjs';
import core from '../../../../packages/workbox-core/index.mjs';
import logger from '../../../../packages/workbox-core/utils/logger.mjs';


describe(`workbox-core logger`, function() {
  let sandbox;

  before(async function() {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function() {
    // Reset between runs
    core.setLogLevel(LOG_LEVELS.debug);
  });

  afterEach(function() {
    sandbox.restore();
  });

  const validateStub = (stub, expectedArgs) => {
    expect(stub.callCount).to.equal(1);

    const calledArgs = stub.args[0];
    const prefix = calledArgs.splice(0, 2);

    expect(calledArgs).to.deep.equal(expectedArgs);

    // 'workbox' is our prefix and '%c' enables styling in the console.
    expect(prefix[0]).to.equal('%cworkbox');
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

  logDetails.forEach((logDetail) => {
    describe(`.${logDetail.name}()`, function() {
      it('should work without input', function() {
        const stub = sandbox.stub(console, logDetail.name);

        logger[logDetail.name]();

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        validateStub(stub, []);
      });

      it(`should work several inputs`, function() {
        const stub = sandbox.stub(console, logDetail.name);

        const args = ['', 'test', null, undefined, [], {}];
        logger[logDetail.name](...args);

        // Restore to avoid upsetting mocha logs.
        sandbox.restore();

        validateStub(stub, args);
      });

      const logLevels = Object.keys(LOG_LEVELS);
      logLevels.forEach((logLevelName) => {
        it(`should behave correctly with ${logLevelName} log level`, function() {
          const stub = sandbox.stub(console, logDetail.name);

          core.setLogLevel(LOG_LEVELS[logLevelName]);
          const args = ['test'];
          logger[logDetail.name](...args);

          // Restore to avoid upsetting mocha logs.
          sandbox.restore();

          if (logDetail.level >= LOG_LEVELS[logLevelName] && logLevelName !== 'silent') {
            validateStub(stub, args);
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

        core.setLogLevel(LOG_LEVELS[logLevelName]);
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

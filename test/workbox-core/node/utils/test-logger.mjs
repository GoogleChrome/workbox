import {expect} from 'chai';
import sinon from 'sinon';

import logger from '../../../../packages/workbox-core/utils/logger.mjs';
import logPrefix from '../../../../packages/workbox-core/utils/logPrefix.mjs';
import {LOG_LEVELS} from '../../../../packages/workbox-core/index.mjs';

describe(`logger`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function() {
    // Reset between runs
    logger.logLevel = LOG_LEVELS.verbose;
  });

  afterEach(function() {
    sandbox.restore();
  });

  /*
   * Why .calledWithMatch()?
   *
   * This method is part of the sinon stub API and will ensure that the
   * stubbed method was called "with matching arguments (and possibly others)."
   * This means logHelper can add a prefix to the log and still pass the
   * assertion.
   */

  describe('.log()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'log');

      logger.log();

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'log');

      const args = ['', 'test', null, undefined, [], {}];
      logger.log(...args);

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch(...logPrefix(LOG_LEVELS.verbose), ...args)).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = LOG_LEVELS.verbose;
      logger.log('test');

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with debug log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = LOG_LEVELS.debug;
      logger.log('test');

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with warning log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = LOG_LEVELS.warning;
      logger.log('test');

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(0);

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = LOG_LEVELS.error;
      logger.log('test');

      // Restore to avoid upsetting mocha logs.
      sandbox.restore();

      expect(stub.callCount).to.equal(0);
    });
  });

  describe('.debug()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.debug();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.debug('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = LOG_LEVELS.verbose;
      logger.debug('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with debug log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = LOG_LEVELS.debug;
      logger.debug('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with warning log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = LOG_LEVELS.warning;
      logger.debug('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = LOG_LEVELS.error;
      logger.debug('test');

      expect(stub.callCount).to.equal(0);
    });
  });

  describe('.warn()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.warn();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.warn('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = LOG_LEVELS.verbose;
      logger.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with debug log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = LOG_LEVELS.debug;
      logger.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with warning log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = LOG_LEVELS.warning;
      logger.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = LOG_LEVELS.error;
      logger.warn('test');

      expect(stub.callCount).to.equal(0);
    });
  });

  describe('.error()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'error');

      logger.error();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'error');

      logger.error('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = LOG_LEVELS.verbose;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with error log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = LOG_LEVELS.debug;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with warning log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = LOG_LEVELS.warning;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with error log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = LOG_LEVELS.error;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });
  });
});

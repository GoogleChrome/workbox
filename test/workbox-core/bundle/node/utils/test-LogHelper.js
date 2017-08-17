import {expect} from 'chai';
import sinon from 'sinon';

import LogHelper from '../../../../../packages/workbox-core/INTERNAL/utils/LogHelper.mjs';
import WorkboxError from '../../../../../packages/workbox-core/INTERNAL/models/WorkboxError.mjs';
import generateVariantTests from '../../../../../infra/utils/generate-variant-tests';

describe(`logHelper [${process.env.NODE_ENV}]`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('constructor', function() {
    it(`should require no arguments`, function() {
      expect(() => {
        new LogHelper();
      }).to.not.throw();
    });
  });

  describe(`LOG_LEVELS`, function() {
    it(`should expose the valid LOG_LEVELS`, function() {
      const logHelper = new LogHelper();
      expect(logHelper.LOG_LEVELS).to.exist;
    });

    it(`should expose the expected LOG_LEVELS`, function() {
      const logHelper = new LogHelper();
      expect(logHelper.LOG_LEVELS.verbose).to.exist;
      expect(logHelper.LOG_LEVELS.debug).to.exist;
      expect(logHelper.LOG_LEVELS.warning).to.exist;
      expect(logHelper.LOG_LEVELS.error).to.exist;
    });
  });

  describe(`.logLevel (setter)`, function() {
    it(`should allow valid log levels`, function() {
      const logHelper = new LogHelper();
      expect(() => {
        logHelper.logLevel = logHelper.LOG_LEVELS.verbose;
        logHelper.logLevel = logHelper.LOG_LEVELS.debug;
        logHelper.logLevel = logHelper.LOG_LEVELS.warning;
        logHelper.logLevel = logHelper.LOG_LEVELS.error;
      }).to.not.throw();
    });

    it(`should not allow log level less than verbose`, function() {
      const logHelper = new LogHelper();
      expect(() => {
        logHelper.logLevel = logHelper.LOG_LEVELS.verbose - 1;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-value');
    });

    it(`should not allow log level greater than error`, function() {
      const logHelper = new LogHelper();
      expect(() => {
        logHelper.logLevel = logHelper.LOG_LEVELS.error + 1;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-value');
    });

    // TODO: Catch WorkboxError with error code
    generateVariantTests(`should not allow non-number log levels`, [
      undefined,
      null,
      '',
      [],
      {},
    ], (variant) => {
      expect(() => {
        const logHelper = new LogHelper();
        logHelper.logLevel = undefined;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-type');
    });
  });

  /**
   * Why .calledWithMatch()?
   *
   * This method on sinon spies will ensure that the spied method was called
   * "with matching arguments (and possibly others)." This means logHelper
   * can add a prefix to the log and still pass the assertion.
   */

  describe('.log()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'log');

      const logHelper = new LogHelper();
      logHelper.log();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'log');

      const logHelper = new LogHelper();
      logHelper.log('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'log');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.verbose;
      logHelper.log('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with debug log level', function() {
      const stub = sandbox.stub(console, 'log');

      const logHelper = new LogHelper();

      logHelper.logLevel = logHelper.LOG_LEVELS.debug;
      logHelper.log('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with warning log level', function() {
      const stub = sandbox.stub(console, 'log');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.warning;
      logHelper.log('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'log');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.error;
      logHelper.log('test');

      expect(stub.callCount).to.equal(0);
    });
  });

  describe('.debug()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'debug');

      const logHelper = new LogHelper();
      logHelper.debug();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'debug');

      const logHelper = new LogHelper();
      logHelper.debug('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'debug');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.verbose;
      logHelper.debug('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with debug log level', function() {
      const stub = sandbox.stub(console, 'debug');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.debug;
      logHelper.debug('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with warning log level', function() {
      const stub = sandbox.stub(console, 'debug');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.warning;
      logHelper.debug('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'debug');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.error;
      logHelper.debug('test');

      expect(stub.callCount).to.equal(0);
    });
  });

  describe('.warn()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'warn');

      const logHelper = new LogHelper();
      logHelper.warn();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'warn');

      const logHelper = new LogHelper();
      logHelper.warn('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'warn');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.verbose;
      logHelper.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with debug log level', function() {
      const stub = sandbox.stub(console, 'warn');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.debug;
      logHelper.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with warning log level', function() {
      const stub = sandbox.stub(console, 'warn');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.warning;
      logHelper.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'warn');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.error;
      logHelper.warn('test');

      expect(stub.callCount).to.equal(0);
    });
  });

  describe('.error()', function() {
    it('should work without input', function() {
      const stub = sandbox.stub(console, 'error');

      const logHelper = new LogHelper();
      logHelper.error();

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'error');

      const logHelper = new LogHelper();
      logHelper.error('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'error');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.verbose;
      logHelper.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with error log level', function() {
      const stub = sandbox.stub(console, 'error');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.debug;
      logHelper.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with warning log level', function() {
      const stub = sandbox.stub(console, 'error');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.warning;
      logHelper.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with error log level', function() {
      const stub = sandbox.stub(console, 'error');

      const logHelper = new LogHelper();
      logHelper.logLevel = logHelper.LOG_LEVELS.error;
      logHelper.error('test');

      expect(stub.callCount).to.equal(1);
    });
  });
});

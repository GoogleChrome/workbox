import {expect} from 'chai';
import sinon from 'sinon';

import logger from '../../../../packages/workbox-core/utils/logger.mjs';
import WorkboxError from '../../../../packages/workbox-core/models/WorkboxError.mjs';
import generateVariantTests from '../../../../infra/utils/generate-variant-tests';

describe(`logger`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function() {
    // Reset between runs
    logger.logLevel = logger.LOG_LEVELS.verbose;
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`LOG_LEVELS`, function() {
    it(`should expose the valid LOG_LEVELS`, function() {
      expect(logger.LOG_LEVELS).to.exist;
    });

    it(`should expose the expected LOG_LEVELS`, function() {
      expect(logger.LOG_LEVELS.verbose).to.exist;
      expect(logger.LOG_LEVELS.debug).to.exist;
      expect(logger.LOG_LEVELS.warning).to.exist;
      expect(logger.LOG_LEVELS.error).to.exist;
    });
  });

  describe(`.logLevel (setter)`, function() {
    it(`should allow valid log levels`, function() {
      expect(() => {
        logger.logLevel = logger.LOG_LEVELS.verbose;
        logger.logLevel = logger.LOG_LEVELS.debug;
        logger.logLevel = logger.LOG_LEVELS.warning;
        logger.logLevel = logger.LOG_LEVELS.error;
      }).to.not.throw();
    });

    it(`should not allow log level less than verbose`, function() {
      expect(() => {
        logger.logLevel = logger.LOG_LEVELS.verbose - 1;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-value');
    });

    it(`should not allow log level greater than error`, function() {
      expect(() => {
        logger.logLevel = logger.LOG_LEVELS.error + 1;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-value');
    });

    generateVariantTests(`should not allow non-number log levels`, [
      undefined,
      null,
      '',
      [],
      {},
    ], (variant) => {
      expect(() => {
        logger.logLevel = variant;
      }).to.throw(WorkboxError).that.has.property('name').that.equals('invalid-type');
    });
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

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch()).to.equal(true);
    });

    it('should work several inputs', function() {
      const stub = sandbox.stub(console, 'log');

      logger.log('', 'test', null, undefined, [], {});

      expect(stub.callCount).to.equal(1);
      expect(stub.calledWithMatch('', 'test', null, undefined, [], {})).to.equal(true);
    });

    it('should log with verbose log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = logger.LOG_LEVELS.verbose;
      logger.log('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with debug log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = logger.LOG_LEVELS.debug;
      logger.log('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with warning log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = logger.LOG_LEVELS.warning;
      logger.log('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'log');

      logger.logLevel = logger.LOG_LEVELS.error;
      logger.log('test');

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

      logger.logLevel = logger.LOG_LEVELS.verbose;
      logger.debug('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with debug log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = logger.LOG_LEVELS.debug;
      logger.debug('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with warning log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = logger.LOG_LEVELS.warning;
      logger.debug('test');

      expect(stub.callCount).to.equal(0);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'debug');

      logger.logLevel = logger.LOG_LEVELS.error;
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

      logger.logLevel = logger.LOG_LEVELS.verbose;
      logger.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with debug log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = logger.LOG_LEVELS.debug;
      logger.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with warning log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = logger.LOG_LEVELS.warning;
      logger.warn('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should not log with error log level', function() {
      const stub = sandbox.stub(console, 'warn');

      logger.logLevel = logger.LOG_LEVELS.error;
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

      logger.logLevel = logger.LOG_LEVELS.verbose;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with error log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = logger.LOG_LEVELS.debug;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with warning log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = logger.LOG_LEVELS.warning;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });

    it('should log with error log level', function() {
      const stub = sandbox.stub(console, 'error');

      logger.logLevel = logger.LOG_LEVELS.error;
      logger.error('test');

      expect(stub.callCount).to.equal(1);
    });
  });
});

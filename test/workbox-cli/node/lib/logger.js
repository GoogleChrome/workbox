const expect = require('chai').expect;
const sinon = require('sinon');

const logger = require('../../../../packages/workbox-cli/src/lib/logger');

describe(`[workbox-cli] lib/logger.js`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  it(`should call console.log() when logger.debug() is used`, function() {
    const stub = sandbox.stub(console, 'log');
    logger.debug('Test');
    sandbox.restore();
    expect(stub.calledOnce).to.be.true;
  });

  it(`should call console.log() when logger.log() is used`, function() {
    const stub = sandbox.stub(console, 'log');
    logger.log('Test');
    sandbox.restore();
    expect(stub.calledOnce).to.be.true;
  });

  it(`should call console.warn() when logger.warn() is used`, function() {
    const stub = sandbox.stub(console, 'warn');
    logger.warn('Test');
    sandbox.restore();
    expect(stub.calledOnce).to.be.true;
  });

  it(`should call console.error() when logger.error() is used`, function() {
    const stub = sandbox.stub(console, 'error');
    logger.error('Test');
    sandbox.restore();
    expect(stub.calledOnce).to.be.true;
  });
});


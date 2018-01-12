const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const MODULE_PATH = '../../../../packages/workbox-cli/src/lib/run-wizard';

describe(`[workbox-cli] lib/run-wizard.js`, function() {
  it(`should write the configuration to the expected location based on the answers provided, when swSrc is not provided`, async function() {
    const configLocation = '/path/to/config.js';
    const config = {dummy: 123};
    const fseWriteFileStub = sinon.stub().resolves();
    const loggerStub = sinon.stub();

    const runWizard = proxyquire(MODULE_PATH, {
      './logger': {
        log: loggerStub,
      },
      './questions/ask-questions': () => {
        return {config, configLocation};
      },
      'fs-extra': {
        writeFile: fseWriteFileStub,
      },
    });

    await runWizard();
    const fseArgs = fseWriteFileStub.firstCall.args;
    expect(fseArgs[0]).to.eql(configLocation);
    expect(fseArgs[1]).to.eql(`module.exports = ${JSON.stringify(config, null, 2)};`);
    expect(loggerStub.calledTwice).to.be.true;
  });

  it(`should write the configuration to the expected location based on the answers provided, when swSrc is provided`, async function() {
    const swSrc = '/path/to/sw.js';
    const configLocation = '/path/to/config.js';
    const config = {dummy: 123};
    const fseWriteFileStub = sinon.stub().resolves();
    const assertValidSwSrcStub = sinon.stub().resolves();
    const loggerStub = sinon.stub();

    const runWizard = proxyquire(MODULE_PATH, {
      './assert-valid-sw-src': assertValidSwSrcStub,
      './logger': {
        log: loggerStub,
      },
      './questions/ask-questions': () => {
        return {config, configLocation};
      },
      'fs-extra': {
        writeFile: fseWriteFileStub,
      },
    });

    await runWizard({swSrc});

    expect(assertValidSwSrcStub.firstCall.args).to.eql([swSrc]);
    const fseArgs = fseWriteFileStub.firstCall.args;
    expect(fseArgs[0]).to.eql(configLocation);
    expect(fseArgs[1]).to.eql(`module.exports = ${JSON.stringify(config, null, 2)};`);
    expect(loggerStub.calledTwice).to.be.true;
  });
});


const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const MODULE_PATH = '../../../../packages/workbox-cli/src/lib/run-wizard';

describe(`[workbox-cli] lib/run-wizard.js`, function() {
  it(`should write the configuration to the expected location based on the answers provided`, async function() {
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
});


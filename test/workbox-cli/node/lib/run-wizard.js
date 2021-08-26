/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const upath = require('upath');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const MODULE_PATH = '../../../../packages/workbox-cli/build/lib/run-wizard';

describe(`[workbox-cli] lib/run-wizard.js`, function () {
  it(`should write the configuration to the expected location based on the answers provided`, async function () {
    const configLocation = upath.join('path', 'to', 'config.js');
    const config = {dummy: 123, regExp: [/1/, /2/]};
    const fseWriteFileStub = sinon.stub().resolves();
    const loggerStub = sinon.stub();

    const {runWizard} = proxyquire(MODULE_PATH, {
      './logger': {
        logger: {
          log: loggerStub,
        },
      },
      './questions/ask-questions': {
        askQuestions: () => {
          return {config, configLocation};
        },
      },
      'fs-extra': {
        writeFile: fseWriteFileStub,
      },
    });

    await runWizard();
    const fseArgs = fseWriteFileStub.firstCall.args;
    expect(fseArgs[0]).to.eql(configLocation);
    // See https://github.com/GoogleChrome/workbox/issues/2796
    expect(fseArgs[1]).to.eql(
      `module.exports = {
\tdummy: 123,
\tregExp: [
\t\t/1/,
\t\t/2/
\t]
};`,
    );
    expect(loggerStub.calledTwice).to.be.true;
  });
});

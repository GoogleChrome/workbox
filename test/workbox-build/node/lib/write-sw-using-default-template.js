const expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] lib/write-sw-using-default-template.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/write-sw-using-default-template';

  it(`should reject with an error when fs-extra.mkdirp() fails`, async function() {
    const writeSWUsingDefaultTemplate = proxyquire(MODULE_PATH, {
      'path': {
        dirname: () => 'ignored',
      },
      'fs-extra': {
        mkdirp: () => Promise.reject(new Error()),
      },
    });

    try {
      await writeSWUsingDefaultTemplate({});
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-make-sw-directory']);
    }
  });

  it(`should reject with an error when fs-extra.writeFile() fails`, async function() {
    const writeSWUsingDefaultTemplate = proxyquire(MODULE_PATH, {
      'path': {
        dirname: () => 'ignored',
      },
      'fs-extra': {
        mkdirp: () => Promise.resolve(),
        writeFile: () => Promise.reject(new Error()),
      },
    });

    try {
      await writeSWUsingDefaultTemplate({});
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['sw-write-failure']);
    }
  });

  it(`should reject with a specific error when fs-extra.writeFile() fails due to EISDIR`, async function() {
    const eisdirError = new Error();
    eisdirError.code = 'EISDIR';

    const writeSWUsingDefaultTemplate = proxyquire(MODULE_PATH, {
      'path': {
        dirname: () => 'ignored',
      },
      'fs-extra': {
        mkdirp: () => Promise.resolve(),
        readFile: () => Promise.resolve(),
        writeFile: () => Promise.reject(eisdirError),
      },
    });

    try {
      await writeSWUsingDefaultTemplate({});
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['sw-write-failure-directory']);
    }
  });

  it(`should call fs-extra.writeFile() with the expected parameters when everything succeeds`, async function() {
    const expectedPath = path.join('expected', 'path');
    const swDest = path.join(expectedPath, 'sw.js');
    const populatedTemplate = 'populated-template';

    const writeFileStub = sinon.stub().returns(Promise.resolve());
    const writeSWUsingDefaultTemplate = proxyquire(MODULE_PATH, {
      'fs-extra': {
        mkdirp: (path) => {
          expect(path).to.eql(expectedPath);
        },
        readFile: () => Promise.resolve(),
        writeFile: writeFileStub,
      },
      './populate-sw-template': () => populatedTemplate,
    });

    await writeSWUsingDefaultTemplate({swDest});
    expect(writeFileStub.alwaysCalledWith(swDest, populatedTemplate)).to.be.true;
  });
});

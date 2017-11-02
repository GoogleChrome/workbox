const expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] lib/copy-workbox-libraries.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/copy-workbox-libraries';
  const DEST_DIRECTORY = path.join(path.sep, 'test-dir');

  it(`should reject with an error when the copy fails`, async function() {
    const copyWorkboxLibraries = proxyquire(MODULE_PATH, {
      'fs-extra': {
        ensureDir: sinon.stub().resolves(),
        copy: sinon.stub().rejects(),
      },
    });

    try {
      await copyWorkboxLibraries(DEST_DIRECTORY);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-copy-workbox-libraries']);
    }
  });

  it(`should resolve with the new directory name after the copy completes`, async function() {
    const copyStub = sinon.stub().resolves();
    const ensureDirStub = sinon.stub().resolves();

    const copyWorkboxLibraries = proxyquire(MODULE_PATH, {
      'fs-extra': {
        copy: copyStub,
        ensureDir: ensureDirStub,
      },
    });

    const workboxDirectory = await copyWorkboxLibraries(DEST_DIRECTORY);
    // The workboxDirectory value is a relative path from DEST_DIRECTORY to the
    // new directory. We check if ensureDir was called with the full path.
    expect(path.join(DEST_DIRECTORY, workboxDirectory)).to.eql(ensureDirStub.args[0][0]);

    // This reflects the number of library files that were copied over:
    // - both prod and dev builds
    // - source maps for each
    expect(copyStub.callCount).to.eql(20);
  });
});

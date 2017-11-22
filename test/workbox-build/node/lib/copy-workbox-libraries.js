const expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] lib/copy-workbox-libraries.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/copy-workbox-libraries';
  const ABSOLUTE_DEST_DIRECTORY = path.join(path.sep, 'test-dir');
  const RELATIVE_DEST_DIRECTORY = path.join('.', 'test-dir');

  it(`should reject with an error when the copy fails`, async function() {
    const copyWorkboxLibraries = proxyquire(MODULE_PATH, {
      'fs-extra': {
        ensureDir: sinon.stub().resolves(),
        copy: sinon.stub().rejects(),
      },
    });

    try {
      await copyWorkboxLibraries(ABSOLUTE_DEST_DIRECTORY);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-copy-workbox-libraries']);
    }
  });

  for (const destDir of [ABSOLUTE_DEST_DIRECTORY, RELATIVE_DEST_DIRECTORY]) {
    it(`should resolve with the new directory name, using a destDir of ${destDir}`, async function() {
      const copyStub = sinon.stub().resolves();
      const ensureDirStub = sinon.stub().resolves();

      const copyWorkboxLibraries = proxyquire(MODULE_PATH, {
        'fs-extra': {
          copy: copyStub,
          ensureDir: ensureDirStub,
        },
      });

      const workboxDirectory = await copyWorkboxLibraries(destDir);
      // The workboxDirectory value is a relative path from destDir to the
      // new directory. We check if ensureDir was called with the combined path.
      const expectedPath = path.join(destDir, workboxDirectory);
      expect(expectedPath).to.eql(ensureDirStub.args[0][0]);

      // This reflects the number of library files that were copied over:
      // - both prod and dev builds
      // - source maps for each
      expect(copyStub.callCount).to.eql(40);
    });
  }
});

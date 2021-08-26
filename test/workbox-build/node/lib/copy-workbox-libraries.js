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

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] lib/copy-workbox-libraries.js`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/copy-workbox-libraries';
  const ABSOLUTE_DEST_DIRECTORY = upath.join('/', 'test-dir');
  const RELATIVE_DEST_DIRECTORY = upath.join('.', 'test-dir');

  it(`should reject with an error when the copy fails`, async function () {
    const {copyWorkboxLibraries} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        ensureDir: sinon.stub().resolves(),
        copy: sinon.stub().rejects('INJECTED_ERROR'),
      },
    });

    try {
      await copyWorkboxLibraries(ABSOLUTE_DEST_DIRECTORY);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(
        errors['unable-to-copy-workbox-libraries'],
      );
    }
  });

  for (const destDir of [ABSOLUTE_DEST_DIRECTORY, RELATIVE_DEST_DIRECTORY]) {
    it(`should resolve with the new directory name, using a destDir of ${destDir}`, async function () {
      const copyStub = sinon.stub().resolves();
      const ensureDirStub = sinon.stub().resolves();

      const {copyWorkboxLibraries} = proxyquire(MODULE_PATH, {
        'fs-extra': {
          copy: copyStub,
          ensureDir: ensureDirStub,
        },
      });

      const workboxDirectory = await copyWorkboxLibraries(destDir);
      // The workboxDirectory value is a relative path from destDir to the
      // new directory. We check if ensureDir was called with the combined upath.
      const expectedPath = upath.join(destDir, workboxDirectory);
      expect(expectedPath).to.eql(ensureDirStub.args[0][0]);

      // The total number of package build directories that were copied:
      expect(copyStub.callCount).to.eql(15);
    });
  }
});

const expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`lib/copy-workbox-sw.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/copy-workbox-sw';
  const DEST_DIRECTORY = '/test';
  const BUILD_TYPE = 'test';

  it(`should reject with an error when the copy fails`, async function() {
    const copyWorkboxSW = proxyquire(MODULE_PATH, {
      'fs-extra': {
        copy: () => Promise.reject(),
      },
    });

    try {
      await copyWorkboxSW(DEST_DIRECTORY, BUILD_TYPE);
      throw Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-copy-workbox-sw']);
    }
  });

  it(`should resolve with the file name after the copy completes`, async function() {
    const copiedFiles = [];

    const copyWorkboxSW = proxyquire(MODULE_PATH, {
      'fs-extra': {
        copy: (src, dest) => {
          copiedFiles.push(dest);
          return Promise.resolve();
        },
      },
    });

    const workboxSWDestPath = await copyWorkboxSW(DEST_DIRECTORY, BUILD_TYPE);
    const {dir, base} = path.parse(workboxSWDestPath);

    expect(dir).to.eql(DEST_DIRECTORY);
    expect(base).to.have.string(BUILD_TYPE);
    expect(copiedFiles).to.have.lengthOf(2);
    expect(copiedFiles).to.include(workboxSWDestPath);
    expect(copiedFiles).to.include(`${workboxSWDestPath}.map`);
  });
});

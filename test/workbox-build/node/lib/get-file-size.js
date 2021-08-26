/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {
  errors,
} = require('../../../../packages/workbox-build/build/lib/errors.js');

describe(`[workbox-build] lib/get-file-size.js`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/get-file-size';
  const FILE = 'file.txt';

  it(`should throw when fs.statSync() fails`, function () {
    const {getFileSize} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        statSync: () => {
          throw new Error();
        },
      },
    });

    try {
      getFileSize(FILE);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-get-file-size']);
    }
  });

  it(`should return null for non-files`, function () {
    const {getFileSize} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        statSync: () => {
          return {
            isFile: () => false,
          };
        },
      },
    });

    const size = getFileSize(FILE);
    expect(size).not.to.exist;
  });

  it(`should return the expected file size`, function () {
    const expectedSize = 1234;

    const {getFileSize} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        statSync: () => {
          return {
            isFile: () => true,
            size: expectedSize,
          };
        },
      },
    });

    const size = getFileSize(FILE);
    expect(size).to.eql(expectedSize);
  });
});

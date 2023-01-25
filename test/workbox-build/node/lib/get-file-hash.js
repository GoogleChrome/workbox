/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] lib/get-file-hash.js`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/get-file-hash';
  const FILE = 'file.txt';

  it(`should throw when there's a fs.readFileSync() error`, function () {
    const {getFileHash} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        readFileSync: () => {
          throw new Error();
        },
      },
    });

    try {
      getFileHash(FILE);
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-get-file-hash']);
    }
  });

  it(`should return the hash corresponding to a file's contents`, function () {
    const buffer = Buffer.alloc(10);
    const hashForBuffer = 'a63c90cc3684ad8b0a2176a6a8fe9005';

    const {getFileHash} = proxyquire(MODULE_PATH, {
      'fs-extra': {
        readFileSync: (file) => {
          if (file !== FILE) {
            throw new Error(`Unexpected file name: ${file}`);
          }
          return buffer;
        },
      },
    });

    const hash = getFileHash(FILE);
    expect(hash).to.eql(hashForBuffer);
  });
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const upath = require('upath');
const proxyquire = require('proxyquire');

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] lib/get-file-details.js`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/get-file-details';
  const GLOB_DIRECTORY = './';
  const GLOB_PATTERN = 'file*';
  const DIRECTORY = 'directory';
  const FILE1 = 'file1.txt';
  const FILE2 = 'file2.js';
  const SIZE = 1234;
  const HASH = 'example-hash';

  it(`should throw when there's a glob.sync() error`, function () {
    const {getFileDetails} = proxyquire(MODULE_PATH, {
      glob: {
        sync: () => {
          throw new Error();
        },
      },
    });

    try {
      getFileDetails({
        globDirectory: GLOB_DIRECTORY,
        globPattern: GLOB_PATTERN,
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-glob-files']);
    }
  });

  it(`should return a warning when the pattern doesn't match anything`, function () {
    const {getFileDetails} = proxyquire(MODULE_PATH, {
      glob: {
        sync: () => [],
      },
    });

    const {globbedFileDetails, warning} = getFileDetails({
      globDirectory: GLOB_DIRECTORY,
      globPattern: GLOB_PATTERN,
    });
    expect(globbedFileDetails).to.be.empty;
    expect(warning).to.have.string(errors['useless-glob-pattern']);
  });

  it(`should return array of file details, without null values`, function () {
    const {getFileDetails} = proxyquire(MODULE_PATH, {
      'glob': {
        sync: () => {
          return [FILE1, FILE2, DIRECTORY];
        },
      },
      './get-file-size': {
        getFileSize: (value) => {
          if (upath.normalize(value) === upath.normalize(DIRECTORY)) {
            return null;
          }
          return SIZE;
        },
      },
      './get-file-hash': {
        getFileHash: (value) => {
          if (upath.normalize(value) === upath.normalize(DIRECTORY)) {
            throw new Error(
              `getFileHash(${DIRECTORY}) shouldn't have been called.`,
            );
          }
          return HASH;
        },
      },
    });

    const {globbedFileDetails, warning} = getFileDetails({
      globDirectory: GLOB_DIRECTORY,
      globPattern: GLOB_PATTERN,
    });

    expect(warning).to.eql('');
    expect(globbedFileDetails).to.deep.equal([
      {
        file: FILE1,
        hash: HASH,
        size: SIZE,
      },
      {
        file: FILE2,
        hash: HASH,
        size: SIZE,
      },
    ]);
  });
});

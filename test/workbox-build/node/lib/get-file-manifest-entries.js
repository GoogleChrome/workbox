/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] Test getFileManifestEntries`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/get-file-manifest-entries';
  const GLOB_DIRECTORY = './';
  const GLOB_PATTERNS = ['invalid*'];
  const FILE = {
    file: 'file1.txt',
    size: 1234,
    hash: 'hash1',
  };

  it(`should return empty info when neither globDirectory nor templatedURLs are provided`, async function () {
    const {getFileManifestEntries} = require(MODULE_PATH);

    const {count, size, manifestEntries} = await getFileManifestEntries({});

    expect(count).to.eql(0);
    expect(size).to.eql(0);
    expect(manifestEntries).to.have.lengthOf(0);
  });

  it(`should not return the same file twice`, async function () {
    const {getFileManifestEntries} = proxyquire(MODULE_PATH, {
      './get-file-details': {
        getFileDetails: () => {
          return {
            globbedFileDetails: [FILE, FILE],
            warning: undefined,
          };
        },
      },
    });

    const {count, size, manifestEntries} = await getFileManifestEntries({
      globDirectory: GLOB_DIRECTORY,
      globPatterns: GLOB_PATTERNS,
    });

    expect(count).to.eql(1);
    expect(size).to.eql(FILE.size);
    expect(manifestEntries).to.deep.equal([
      {
        url: FILE.file,
        revision: FILE.hash,
      },
    ]);
  });

  it(`should throw when a templatedURL matches a globbed file`, async function () {
    const {getFileManifestEntries} = proxyquire(MODULE_PATH, {
      './get-file-details': {
        getFileDetails: () => {
          return {
            globbedFileDetails: [FILE],
            warning: undefined,
          };
        },
      },
    });

    try {
      await getFileManifestEntries({
        globDirectory: GLOB_DIRECTORY,
        globPatterns: GLOB_PATTERNS,
        templatedURLs: {
          [FILE.file]: '',
        },
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(
        errors['templated-url-matches-glob'],
      );
    }
  });

  it(`should treat an exception thrown by getFileDetails() as a warning message`, async function () {
    const warningMessage = 'test warning';
    const {getFileManifestEntries} = proxyquire(MODULE_PATH, {
      './get-file-details': {
        getFileDetails: () => {
          throw new Error(warningMessage);
        },
      },
    });

    const {warnings} = await getFileManifestEntries({
      globDirectory: GLOB_DIRECTORY,
      globPatterns: GLOB_PATTERNS,
      templatedURLs: {
        [FILE.file]: '',
      },
    });

    expect(warnings).to.eql([warningMessage]);
  });

  it(`should throw when a templatedURL contains a pattern that doesn't match anything`, async function () {
    const {getFileManifestEntries} = require(MODULE_PATH);

    try {
      await getFileManifestEntries({
        globDirectory: GLOB_DIRECTORY,
        templatedURLs: {
          [FILE.file]: GLOB_PATTERNS,
        },
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['bad-template-urls-asset']);
    }
  });

  it(`should return results that take both glob patterns and templatedURLs into account`, async function () {
    const url1 = '/path/to/url1';
    const url2 = '/path/to/url2';
    const stringValue = 'string';

    const {getFileManifestEntries} = proxyquire(MODULE_PATH, {
      './get-file-details': {
        getFileDetails: () => {
          return {
            globbedFileDetails: [FILE],
            warning: undefined,
          };
        },
      },
    });

    const {count, size, manifestEntries} = await getFileManifestEntries({
      globDirectory: GLOB_DIRECTORY,
      globPatterns: GLOB_PATTERNS,
      templatedURLs: {
        [url1]: GLOB_PATTERNS,
        [url2]: stringValue,
      },
    });

    expect(count).to.eql(3);
    expect(size).to.eql(FILE.size + FILE.size + stringValue.length);
    expect(manifestEntries).to.deep.equal([
      {
        url: FILE.file,
        revision: FILE.hash,
      },
      {
        url: url1,
        // This is the hash of FILE.hash.
        revision: '00c6ee2e21a7548de6260cf72c4f4b5b',
      },
      {
        url: url2,
        // THis is the hash of stringValue.
        revision: 'b45cffe084dd3d20d928bee85e7b0f21',
      },
    ]);
  });
});

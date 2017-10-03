const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] Test getFileManifestEntries`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/get-file-manifest-entries';
  const GLOB_DIRECTORY = './';
  const GLOB_PATTERNS = ['invalid*'];
  const FILE = {
    file: 'file1.txt',
    size: 1234,
    hash: 'hash1',
  };

  it(`should return empty info when neither globDirectory nor templatedUrls are provided`, async function() {
    const getFileManifestEntries = require(MODULE_PATH);

    const {count, size, manifestEntries} = await getFileManifestEntries({});

    expect(count).to.eql(0);
    expect(size).to.eql(0);
    expect(manifestEntries).to.have.lengthOf(0);
  });

  it(`should not return the same file twice`, async function() {
    const getFileManifestEntries = proxyquire(MODULE_PATH, {
      './get-file-details': () => [FILE, FILE],
    });

    const {count, size, manifestEntries} = await getFileManifestEntries({
      globDirectory: GLOB_DIRECTORY,
      globPatterns: GLOB_PATTERNS,
    });

    expect(count).to.eql(1);
    expect(size).to.eql(FILE.size);
    expect(manifestEntries).to.deep.equal([{
      url: FILE.file,
      revision: FILE.hash,
    }]);
  });

  it(`should throw when a templatedUrl matches a globbed file`, async function() {
    const getFileManifestEntries = proxyquire(MODULE_PATH, {
      './get-file-details': () => [FILE],
    });

    try {
      await getFileManifestEntries({
        globDirectory: GLOB_DIRECTORY,
        globPatterns: GLOB_PATTERNS,
        templatedUrls: {
          [FILE.file]: '',
        },
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['templated-url-matches-glob']);
    }
  });

  it(`should throw when a templatedUrl contains a pattern that doesn't match anything`, async function() {
    const getFileManifestEntries = require(MODULE_PATH);

    try {
      await getFileManifestEntries({
        templatedUrls: {
          [FILE.file]: GLOB_PATTERNS,
        },
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['bad-template-urls-asset']);
    }
  });

  it(`should return results that take both glob patterns and templatedUrls into account`, async function() {
    const url1 = '/path/to/url1';
    const url2 = '/path/to/url2';
    const stringValue = 'string';

    const getFileManifestEntries = proxyquire(MODULE_PATH, {
      './get-file-details': () => [FILE],
    });

    const {count, size, manifestEntries} = await getFileManifestEntries({
      globDirectory: GLOB_DIRECTORY,
      globPatterns: GLOB_PATTERNS,
      templatedUrls: {
        [url1]: GLOB_PATTERNS,
        [url2]: stringValue,
      },
    });

    expect(count).to.eql(3);
    expect(size).to.eql(FILE.size + FILE.size + stringValue.length);
    expect(manifestEntries).to.deep.equal([{
      url: FILE.file,
      revision: FILE.hash,
    }, {
      url: url1,
      // This is the hash of FILE.hash.
      revision: '00c6ee2e21a7548de6260cf72c4f4b5b',
    }, {
      url: url2,
      // THis is the hash of stringValue.
      revision: 'b45cffe084dd3d20d928bee85e7b0f21',
    }]);
  });
});

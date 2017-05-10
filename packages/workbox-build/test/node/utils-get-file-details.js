const proxyquire = require('proxyquire');
const path = require('path');

const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('src/lib/utils/get-file-details.js', function() {
  const INJECTED_ERROR = new Error('Injected Error');

  it('should handle glob sync error', function() {
    const getFileDetails = proxyquire('../../src/lib/utils/get-file-details', {
      glob: {
        sync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    let caughtError;
    try {
      getFileDetails('.', 'fake/glob/pattern/**/*');
    } catch (err) {
      caughtError = err;
    }

    if (caughtError.message.indexOf(errors['unable-to-glob-files']) !== 0) {
      throw new Error('Unexpected error: ' + caughtError.message);
    }
  });

  it(`should throw the correct error when the patters don't match anything`, function() {
    const getFileDetails = proxyquire('../../src/lib/utils/get-file-details', {
      glob: {
        sync: () => [],
      },
    });

    let caughtError;
    try {
      getFileDetails('.', 'fake/glob/pattern/**/*');
    } catch (err) {
      caughtError = err;
    }

    if (caughtError.message.indexOf(errors['useless-glob-pattern']) !== 0) {
      throw new Error('Unexpected error: ' + caughtError.message);
    }
  });

  it('should return array of file details, minus null values', function() {
    const EXAMPLE_DIRECTORY = './EXAMPLE_DIRECTORY';
    const INJECTED_SIZE = 1234;
    const INJECTED_HASH = 'example-hash';

    const OK_FILE_1 = 'ok.txt';
    const OK_FILE_2 = 'ok-2.txt';

    const getFileDetails = proxyquire('../../src/lib/utils/get-file-details', {
      'glob': {
        sync: () => {
          return [
            OK_FILE_1,
            EXAMPLE_DIRECTORY,
            OK_FILE_2,
          ];
        },
      },
      './get-file-size': (value) => {
        if (path.normalize(value) === path.normalize(EXAMPLE_DIRECTORY)) {
          return null;
        }
        return INJECTED_SIZE;
      },
      './get-file-hash': (value) => {
        if (path.normalize(value) === path.normalize(EXAMPLE_DIRECTORY)) {
          // This should never be called with a directory.
          throw INJECTED_ERROR;
        }
        return INJECTED_HASH;
      },
    });

    const files = getFileDetails('.', 'fake/glob/pattern/**/*');

    if (files.length !== 2) {
      throw new Error('Directory not filtered from results');
    }

    files.forEach((fileDetails) => {
      fileDetails.size.should.equal(INJECTED_SIZE);
      fileDetails.hash.should.equal(INJECTED_HASH);
      if ([OK_FILE_1, OK_FILE_2].indexOf(fileDetails.file) === -1) {
        throw new Error('Unexpected Filename: ' + fileDetails.file);
      }
    });
  });

  it('should return array of file details, minus glob ignore values', function() {
    const EXAMPLE_DIRECTORY = './EXAMPLE_DIRECTORY';
    const INJECTED_SIZE = 1234;
    const INJECTED_HASH = 'example-hash';

    const OK_FILE_1 = 'ok.txt';
    const OK_FILE_2 = 'ok-2.txt';

    const GLOB_IGNORE = [
      'node_modules/',
    ];

    const getFileDetails = proxyquire('../../src/lib/utils/get-file-details', {
      'glob': {
        sync: (pattern, options) => {
          if (options.ignore !== GLOB_IGNORE) {
            throw new Error('Injected Error - Expected glob ignores to be set');
          }
          return [
            OK_FILE_1,
            EXAMPLE_DIRECTORY,
            OK_FILE_2,
          ];
        },
      },
      './get-file-size': (value) => {
        if (path.normalize(value) === path.normalize(EXAMPLE_DIRECTORY)) {
          return null;
        }
        return INJECTED_SIZE;
      },
      './get-file-hash': (value) => {
        if (path.normalize(value) === path.normalize(EXAMPLE_DIRECTORY)) {
          // This should never be called with a directory.
          throw INJECTED_ERROR;
        }
        return INJECTED_HASH;
      },
    });

    const files = getFileDetails('.', 'fake/glob/pattern/**/*', GLOB_IGNORE);

    if (files.length !== 2) {
      throw new Error('Directory not filtered from results');
    }

    files.forEach((fileDetails) => {
      fileDetails.size.should.equal(INJECTED_SIZE);
      fileDetails.hash.should.equal(INJECTED_HASH);
      if ([OK_FILE_1, OK_FILE_2].indexOf(fileDetails.file) === -1) {
        throw new Error('Unexpected Filename: ' + fileDetails.file);
      }
    });
  });
});

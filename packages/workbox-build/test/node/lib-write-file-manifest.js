const proxyquire = require('proxyquire');

const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('src/lib/utils/write-file-manifest.js', function() {
  const INJECTED_ERROR = new Error('Injected Error');
  const FAKE_PATH = 'fake-path/manifest-name.js';

  it('should handle a bad manifest format', function() {
    const writeFileManifest = require('../../src/lib/utils/write-file-manifest');
    return writeFileManifest(FAKE_PATH, [], 'invalid-format')
      .then(() => {
        throw new Error('Expected error to be thrown.');
      })
      .catch((err) => {
        if (err.message !== errors['invalid-manifest-format']) {
          throw new Error('Unexpected error thrown: ' + err.message);
        }
      });
  });

  it('should handle bad manifest path', function() {
    const badInputs = [
      true,
      false,
      '',
      [],
      {},
      null,
      undefined,
    ];
    const writeFileManifest = require('../../src/lib/utils/write-file-manifest');
    badInputs.reduce((promiseChain, badInput) => {
      return promiseChain.then(() => {
        return writeFileManifest(badInput, [])
        .then(() => {
          throw new Error('Expected error to be thrown.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-manifest-path']) {
            throw new Error('Unexpected error thrown: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it('should handle bad manifest entries', function() {
    const badInputs = [
      true,
      false,
      '',
      {},
      null,
      undefined,
      [true],
      [false],
      [null],
      [undefined],
      [{
        nope: 'this is useless',
      }],
      [{}],
    ];
    const writeFileManifest = require('../../src/lib/utils/write-file-manifest');
    return badInputs.reduce((promiseChain, badInput) => {
      return promiseChain.then(() => {
        return writeFileManifest('manifest.js', badInput)
        .then(() => {
          throw new Error('Expected error to be thrown.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-manifest-entries']) {
            throw new Error('Unexpected error thrown: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it('should handle failing mkdirp.sync', function() {
    const writeFileManifest = proxyquire('../../src/lib/utils/write-file-manifest', {
      mkdirp: (dirname, cb) => {
        cb(INJECTED_ERROR);
      },
    });

    return writeFileManifest(FAKE_PATH, [])
    .then(() => {
      throw new Error('Expected an error.');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['unable-to-make-manifest-directory']) !== 0) {
        throw new Error('Unexpected Error: ' + caughtError.message);
      }
    });
  });

  it('should handle fs.readFile error when checking template', function() {
    const writeFileManifest = proxyquire('../../src/lib/utils/write-file-manifest', {
      mkdirp: (dirname, cb) => {
        cb();
      },
      fs: {
        readFile: (pathname, encoding, cb) => {
          cb(INJECTED_ERROR);
        },
      },
    });

    return writeFileManifest(FAKE_PATH, [])
    .then(() => {
      throw new Error('Expected an error.');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['read-manifest-template-failure']) !== 0) {
        throw new Error('Unexpected Error: ' + caughtError.message);
      }
    });
  });

  it('should handle error when populating template', function() {
    const writeFileManifest = proxyquire('../../src/lib/utils/write-file-manifest', {
      'mkdirp': (dirname, cb) => {
        cb();
      },
      'fs': {
        readFile: (pathname, encoding, cb) => {
          cb(null, 'Injected Template');
        },
      },
      'lodash.template': () => {
        throw INJECTED_ERROR;
      },
    });

    return writeFileManifest(FAKE_PATH, [])
    .then(() => {
      throw new Error('Expected an error.');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['populating-manifest-tmpl-failed']) !== 0) {
        throw new Error('Unexpected Error: ' + caughtError.message);
      }
    });
  });

  it('should handle error writing file', function() {
    const writeFileManifest = proxyquire('../../src/lib/utils/write-file-manifest', {
      'mkdirp': (dirname, cb) => {
        cb();
      },
      'fs': {
        readFile: (pathname, encoding, cb) => {
          cb(null, 'Injected Template');
        },
        writeFile: (filepath, stringToWrite, cb) => {
          cb(INJECTED_ERROR);
        },
      },
      'lodash.template': () => {
        return () => {
          return 'Injected populated template.';
        };
      },
    });

    return writeFileManifest(FAKE_PATH, [])
    .then(() => {
      throw new Error('Expected an error.');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['manifest-file-write-failure']) !== 0) {
        throw new Error('Unexpected Error: ' + caughtError.message);
      }
    });
  });
});

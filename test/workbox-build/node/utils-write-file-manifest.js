const proxyquire = require('proxyquire');

const errors = require('../../../packages/workbox-build/src/lib/errors.js');

require('chai').should();

describe(`src/lib/utils/write-file-manifest.js`, function() {
  const INJECTED_ERROR = new Error('Injected Error');
  const FAKE_PATH = 'fake-path/manifest-name.js';

  it(`should handle a bad manifest format`, async function() {
    const writeFileManifest = require('../../../packages/workbox-build/src/lib/utils/write-file-manifest');
    try {
      await writeFileManifest(FAKE_PATH, [], 'invalid-format');
      throw new Error('Expected error to be thrown.');
    } catch (error) {
      error.message.should.eql(errors['invalid-manifest-format']);
    }
  });

  it(`should handle bad manifest path`, function() {
    const badInputs = [
      true,
      false,
      '',
      [],
      {},
      null,
      undefined,
    ];
    const writeFileManifest = require('../../../packages/workbox-build/src/lib/utils/write-file-manifest');
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

  it(`should handle bad manifest entries`, async function() {
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
    const writeFileManifest = require('../../../packages/workbox-build/src/lib/utils/write-file-manifest');
    for (const badInput of badInputs) {
      try {
        await writeFileManifest('manifest.js', badInput);
        throw new Error('Expected error to be thrown.');
      } catch (error) {
        error.message.should.eql(errors['invalid-manifest-entries']);
      }
    }
  });

  it(`should handle failing mkdirp`, function() {
    const writeFileManifest = proxyquire('../../../packages/workbox-build/src/lib/utils/write-file-manifest', {
      'fs-extra': {
        mkdirp: () => {
          throw new Error(INJECTED_ERROR);
        },
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

  it(`should handle fse.readFile error when checking template`, function() {
    const writeFileManifest = proxyquire('../../../packages/workbox-build/src/lib/utils/write-file-manifest', {
      'fs-extra': {
        mkdirp: () => {},
        readFile: () => {
          throw new Error(INJECTED_ERROR);
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

  it(`should handle error when populating template`, function() {
    const writeFileManifest = proxyquire('../../../packages/workbox-build/src/lib/utils/write-file-manifest', {
      'fs-extra': {
        mkdirp: () => {},
        readFile: () => 'Injected Template',
      },
      'lodash.template': () => {
        throw new Error(INJECTED_ERROR);
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

  it(`should handle error writing file`, function() {
    const writeFileManifest = proxyquire('../../../packages/workbox-build/src/lib/utils/write-file-manifest', {
      'fs-extra': {
        mkdirp: () => {},
        readFile: () => 'Injected Template',
        writeFile: () => {
          throw new Error(INJECTED_ERROR);
        },
      },
      'lodash.template': () => () => 'Injected populated template.',
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

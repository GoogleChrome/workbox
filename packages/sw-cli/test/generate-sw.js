const proxyquire = require('proxyquire');
const path = require('path');

const errors = require('../src/lib/errors');

describe('Test generateSW()', function() {
  const EXAMPLE_INPUT = {
    rootDirectory: './valid-root',
    fileExtentionsToCache: ['css', 'js', 'html'],
    excludeFiles: [],
    serviceWorkerName: 'sw.js',
  };

  let generateSW;
  before(function() {
    generateSW = proxyquire('../src/lib/generate-sw', {
      './utils/copy-sw-lib': (rootDirectory) => {
        if (rootDirectory === EXAMPLE_INPUT.rootDirectory) {
          return Promise.resolve(path.join(rootDirectory, 'sw-lib.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-sw-lib'));
      },
    });
  });

  // Bad inputs (undefined, null, string, array, boolean)
  it('should be able to handle non-object input', function() {
    const badInput = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        return generateSW(input)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-generate-sw-input']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // rootDirectory - non string - undefined, null, array, boolean,  object
  it('should be able to handle a bad rootDirectory iput', function() {
    const badInput = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.rootDirectory = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-generate-sw-root-directory']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // fileExtentionsToCache - non array, undefined, null, boolean, string,  object
  it('should be able to handle a bad fileExtentionsToCache iput', function() {
    const badInput = [
      undefined,
      null,
      '',
      {},
      [],
      [null],
      [true],
      [false],
      [{}],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.fileExtentionsToCache = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['no-file-extensions-to-cache']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // fileExtensionsToCache - Add warning if the extension name has a '.' as
  //                         first character
  it('should be able to handle a bad file extension', function() {
    let args = Object.assign({}, EXAMPLE_INPUT);
    args.fileExtentionsToCache = ['.example'];
    return generateSW(args)
    .then(() => {
      throw new Error('Expected to throw error.');
    })
    .catch((err) => {
      if (err.message !== errors['no-file-extensions-to-cache']) {
        throw new Error('Unexpected error: ' + err.message);
      }
    });
  });

  // swName - non string, undefined, null, boolean, array, object
  it('should be able to handle bad swName input', function() {
    const badInput = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.swName = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-sw-name']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });
  // swName - empty string

  // excludeFiles - non array, undefined, null, boolea, string, object

  // Success.........................................................

  // rootDirectory - dot
  // rootDirectory - valid nested folder

  // fileExtensionsToCache - single item array
  // fileExtensionsToCache - multiple item with multiple dots

  // swName - multiple dots in name
  // swName - nested path

  // excludeFiles - non existant file
  // excludeFiles - empty array
});

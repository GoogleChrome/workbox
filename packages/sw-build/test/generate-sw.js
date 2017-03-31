const proxyquire = require('proxyquire');
const path = require('path');

const errors = require('../src/lib/errors');

describe('Test generateSW()', function() {
  const EXAMPLE_INPUT = {
    rootDirectory: './valid-root',
    staticFileGlobs: [
      '**/*.{css,js,html}',
    ],
    globIgnores: [
      '!node_modules/',
    ],
    dest: 'sw.js',
  };

  let generateSW;
  beforeEach(function() {
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
          if (err.message !== errors['invalid-root-directory']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // dest - non string, undefined, null, boolean, array, object
  it('should be able to handle bad dest input', function() {
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
        args.dest = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-dest']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // Success.........................................................

  // rootDirectory - dot
  it('should be able to write service worker to current directory', function() {
    let args = Object.assign({}, EXAMPLE_INPUT);
    args.rootDirectory = '.';

    generateSW = proxyquire('../src/lib/generate-sw', {
      './utils/copy-sw-lib': (rootDirectory) => {
        if (rootDirectory === '.') {
          return Promise.resolve(path.join(rootDirectory, 'sw-lib.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-sw-lib'));
      },
      './write-sw': (swPath, manifestEntries, swlibPath, rootDirectory) => {
        if (swPath !== EXAMPLE_INPUT.dest) {
          throw new Error(`Service worker path is an unexpected value: ${swPath}`);
        }
        if (swlibPath !== 'sw-lib.v0.0.0.js') {
          throw new Error(`SW-Lib path is an unexpected value: ${swlibPath}`);
        }
        if (rootDirectory !== '.') {
          throw new Error(`rootDirectory is an unexpected value: ${rootDirectory}`);
        }
        return Promise.resolve();
      },
    });

    return generateSW(args);
  });

  // rootDirectory - valid nested folder
  it('should be able to write service worker to the a directory', function() {
    generateSW = proxyquire('../src/lib/generate-sw', {
      './utils/copy-sw-lib': (rootDirectory) => {
        if (rootDirectory === EXAMPLE_INPUT.rootDirectory) {
          return Promise.resolve(path.join(rootDirectory, 'sw-lib.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-sw-lib'));
      },
      './write-sw': (swPath, manifestEntries, swlibPath, rootDirectory) => {
        if (swPath !== EXAMPLE_INPUT.dest) {
          throw new Error(`Service worker path is an unexpected value: ${swPath}`);
        }
        if (swlibPath !== path.join(EXAMPLE_INPUT.rootDirectory, 'sw-lib.v0.0.0.js')) {
          throw new Error(`SW-Lib path is an unexpected value: ${swlibPath}`);
        }
        if (rootDirectory !== EXAMPLE_INPUT.rootDirectory) {
          throw new Error(`rootDirectory is an unexpected value: ${rootDirectory}`);
        }
        return Promise.resolve();
      },
    });

    let args = Object.assign({}, EXAMPLE_INPUT);
    return generateSW(args);
  });

  // fileExtensionsToCache - single item array
  // fileExtensionsToCache - multiple item with multiple dots

  // swName - multiple dots in name
  // swName - nested path
});

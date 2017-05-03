const proxyquire = require('proxyquire');
const path = require('path');

const errors = require('../../src/lib/errors');

describe('Test generateSW()', function() {
  const EXAMPLE_INPUT = {
    globDirectory: './valid-root',
    staticFileGlobs: [
      '**/*.{css,js,html}',
    ],
    globIgnores: [
      '!node_modules/',
    ],
    dest: 'build/sw.js',
  };

  let generateSW;
  beforeEach(function() {
    generateSW = proxyquire('../../src/lib/generate-sw', {
      './utils/copy-sw-lib': (swlibPath) => {
        if (swlibPath === path.dirname(EXAMPLE_INPUT.dest)) {
          return Promise.resolve(path.join(swlibPath, 'sw-lib.v0.0.0.js'));
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

  // globDirectory - non string - undefined, null, array, boolean,  object
  it('should be able to handle a bad globDirectory iput', function() {
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
        args.globDirectory = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-glob-directory']) {
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

  it('should be able to handle a bad staticFileGlobs input', function() {
    const badInput = [
      {},
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.staticFileGlobs = input;
        return generateSW(args)
        .then(() => {
          console.log('Input did not cause error: ', input);
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-static-file-globs']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it('should be able to handle a bad templatedUrls input', function() {
    this.timeout(4000);

    const badInput = [
      [],
      true,
      1234,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.templatedUrls = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-templated-urls']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it('should be able to handle a bad globIgnores input', function() {
    const badInput = [
      {},
      true,
      [123],
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.globIgnores = input;
        return generateSW(args)
        .then(() => {
          console.log('Input did not cause error: ', input);
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-glob-ignores']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  // Success.........................................................

  // globDirectory - dot
  it('should be able to write service worker to current directory', function() {
    let args = Object.assign({}, EXAMPLE_INPUT);
    args.globDirectory = '.';

    generateSW = proxyquire('../../src/lib/generate-sw', {
      './utils/copy-sw-lib': (copySWLibPath) => {
        if (copySWLibPath === path.dirname(EXAMPLE_INPUT.dest)) {
          return Promise.resolve(path.join(copySWLibPath, 'sw-lib.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-sw-lib'));
      },
      './get-file-manifest-entries': () => {
        return Promise.resolve([{
          file: 'dummy.js',
          hash: 'abc123',
          size: 10,
        }]);
      },
      './write-sw': (swPath, manifestEntries, swlibPath, globDirectory) => {
        if (swPath !== EXAMPLE_INPUT.dest) {
          throw new Error(`Service worker path is an unexpected value: ${swPath}`);
        }
        if (swlibPath !== 'sw-lib.v0.0.0.js') {
          throw new Error(`SW-Lib path is an unexpected value: ${swlibPath}`);
        }
        if (globDirectory !== '.') {
          throw new Error(`globDirectory is an unexpected value: ${globDirectory}`);
        }
        return Promise.resolve();
      },
    });

    return generateSW(args);
  });

  // globDirectory - valid nested folder
  it('should be able to write service worker to the a directory', function() {
    generateSW = proxyquire('../../src/lib/generate-sw', {
      './utils/copy-sw-lib': (swlibPath) => {
        if (swlibPath === path.dirname(EXAMPLE_INPUT.dest)) {
          return Promise.resolve(path.join(swlibPath, 'sw-lib.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-sw-lib'));
      },
      './get-file-manifest-entries': () => {
        return Promise.resolve([{
          file: 'dummy.js',
          hash: 'abc123',
          size: 10,
        }]);
      },
      './write-sw': (swPath, manifestEntries, swlibPath, globDirectory) => {
        if (swPath !== EXAMPLE_INPUT.dest) {
          throw new Error(`Service worker path is an unexpected value: ${swPath}`);
        }
        if (swlibPath !== 'sw-lib.v0.0.0.js') {
          throw new Error(`SW-Lib path is an unexpected value: ${swlibPath}`);
        }
        if (globDirectory !== EXAMPLE_INPUT.globDirectory) {
          throw new Error(`globDirectory is an unexpected value: ${globDirectory}`);
        }
        return Promise.resolve();
      },
    });

    let args = Object.assign({}, EXAMPLE_INPUT);
    return generateSW(args);
  });

  it('should be able to handle bad runtimeCaching input', function() {
    const badInput = [
      {},
      true,
      123,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.runtimeCaching = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-runtime-caching']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });
});

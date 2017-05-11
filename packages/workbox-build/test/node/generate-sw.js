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
    swDest: 'build/sw.js',
  };

  let generateSW;
  beforeEach(function() {
    generateSW = proxyquire('../../src/lib/generate-sw', {
      './utils/copy-workbox-sw': (swlibPath) => {
        if (swlibPath === path.dirname(EXAMPLE_INPUT.swDest)) {
          return Promise.resolve(path.join(swlibPath, 'workbox-sw.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-workbox-sw'));
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

  // swDest - non string, undefined, null, boolean, array, object
  it('should be able to handle bad swDest input', function() {
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
        args.swDest = input;
        return generateSW(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-sw-dest']) {
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
      './utils/copy-workbox-sw': (copySWLibPath) => {
        if (copySWLibPath === path.dirname(EXAMPLE_INPUT.swDest)) {
          return Promise.resolve(path.join(copySWLibPath, 'workbox-sw.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-workbox-sw'));
      },
      './get-file-manifest-entries': () => {
        return Promise.resolve([{
          file: 'dummy.js',
          hash: 'abc123',
          size: 10,
        }]);
      },
      './write-sw': (swPath, manifestEntries, swlibPath, globDirectory) => {
        if (swPath !== EXAMPLE_INPUT.swDest) {
          throw new Error(`Service worker path is an unexpected value: ${swPath}`);
        }
        if (swlibPath !== 'workbox-sw.v0.0.0.js') {
          throw new Error(`workbox-sw path is an unexpected value: ${swlibPath}`);
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
      './utils/copy-workbox-sw': (swlibPath) => {
        if (swlibPath === path.dirname(EXAMPLE_INPUT.swDest)) {
          return Promise.resolve(path.join(swlibPath, 'workbox-sw.v0.0.0.js'));
        }
        return Promise.reject(new Error('Inject Error - copy-workbox-sw'));
      },
      './get-file-manifest-entries': () => {
        return Promise.resolve([{
          file: 'dummy.js',
          hash: 'abc123',
          size: 10,
        }]);
      },
      './write-sw': (swPath, manifestEntries, swlibPath, globDirectory) => {
        if (swPath !== EXAMPLE_INPUT.swDest) {
          throw new Error(`Service worker path is an unexpected value: ${swPath}`);
        }
        if (swlibPath !== 'workbox-sw.v0.0.0.js') {
          throw new Error(`workbox-sw path is an unexpected value: ${swlibPath}`);
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

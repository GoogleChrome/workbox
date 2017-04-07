const proxyquire = require('proxyquire');
const path = require('path');
const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('Copy SW Lib', function() {
  const INJECTED_ERROR = new Error('Injected Error');

  it('should handle file stream error', function() {
    this.timeout(5 * 1000);

    const fakeStream = {
      on: (eventName, cb) => {
        if (eventName === 'error') {
          setTimeout(() => cb(INJECTED_ERROR), 500);
        }
      },
      pipe: (stream) => stream,
    };
    const copySWLib = proxyquire('../../src/lib/utils/copy-sw-lib', {
      mkdirp: {
        sync: () => {
          return;
        },
      },
      fs: {
        createReadStream: () => {
          return fakeStream;
        },
        createWriteStream: () => {
          return fakeStream;
        },
      },
    });

    return copySWLib('fake-path/')
    .then(() => {
      throw new Error('Expected an error to be throw');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['unable-to-copy-sw-lib']) !== 0) {
        throw new Error('Unexpected error: ' + caughtError.message);
      }
    });
  });

  it('should resolve with file name on file stream end', function() {
    this.timeout(5 * 1000);

    const fakeStream = {
      on: (eventName, cb) => {
        if (eventName === 'finish') {
          setTimeout(() => cb(), 500);
        }
      },
      pipe: (stream) => stream,
    };
    const copySWLib = proxyquire('../../src/lib/utils/copy-sw-lib', {
      mkdirp: {
        sync: () => {
          return;
        },
      },
      fs: {
        createReadStream: () => {
          return fakeStream;
        },
        createWriteStream: () => {
          return fakeStream;
        },
      },
    });

    return copySWLib('fake-path/')
    .then((swLibPath) => {
      let pathSep = path.sep;
      if (path.sep === '\\') {
        pathSep = '\\\\';
      }
      const regexPattern = new RegExp(
        `fake-path${pathSep}sw-lib\.v\\d+\.\\d+\.\\d+\.min\.js`);
      if (!swLibPath.match(regexPattern)) {
        console.log('Regular expression: ' + regexPattern);
        throw new Error('Unexpected result from copying swlib: ' + swLibPath);
      }
    });
  });
});

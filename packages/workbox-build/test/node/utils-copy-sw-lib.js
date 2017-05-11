const proxyquire = require('proxyquire');
const path = require('path');
const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('Copy SW Lib', function() {
  it('should reject with an error when the copy fails', function() {
    this.timeout(5 * 1000);

    const copySWLib = proxyquire('../../src/lib/utils/copy-workbox-sw', {
      'fs-extra': {
        copy: () => Promise.reject(),
      },
    });

    return copySWLib('fake-path/')
    .then(() => {
      throw new Error('Expected an error to be throw');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['unable-to-copy-workbox-sw']) !== 0) {
        throw new Error('Unexpected error: ' + caughtError.message);
      }
    });
  });

  it('should resolve with the file name after the copy completes', function() {
    this.timeout(5 * 1000);

    const copySWLib = proxyquire('../../src/lib/utils/copy-workbox-sw', {
      'fs-extra': {
        copy: () => Promise.resolve(),
      },
    });

    return copySWLib('fake-path/')
    .then((swLibPath) => {
      let pathSep = path.sep;
      if (path.sep === '\\') {
        pathSep = '\\\\';
      }
      const regexPattern = new RegExp(
        `fake-path${pathSep}workbox-sw\.prod\.v\\d+\.\\d+\.\\d+\.js`);
      if (!swLibPath.match(regexPattern)) {
        console.log('Regular expression: ' + regexPattern);
        throw new Error('Unexpected result from copying swlib: ' + swLibPath);
      }
    });
  });
});

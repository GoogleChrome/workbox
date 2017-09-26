const proxyquire = require('proxyquire');
const path = require('path');
const errors = require('../../../packages/workbox-build/src/lib/errors.js');

require('chai').should();
const expect = require('chai').expect;

describe(`src/lib/utils/copy-workbox-sw.js`, function() {
  it(`should reject with an error when the copy fails`, function() {
    this.timeout(5 * 1000);

    const copyWorkboxSW = proxyquire('../../../packages/workbox-build/src/lib/utils/copy-workbox-sw', {
      'fs-extra': {
        copy: () => Promise.reject(),
      },
    });

    return copyWorkboxSW('fake-path/')
    .then(() => {
      throw new Error('Expected an error to be throw');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['unable-to-copy-workbox-sw']) !== 0) {
        throw new Error('Unexpected error: ' + caughtError.message);
      }
    });
  });

  it(`should resolve with the file name after the copy completes`, function() {
    this.timeout(5 * 1000);

    let jsFileCopied = false;
    let mapFileCopied = false;

    const copyWorkboxSW = proxyquire('../../../packages/workbox-build/src/lib/utils/copy-workbox-sw', {
      'fs-extra': {
        copy: (inputFilePath, outputFilePath) => {
          // Make sure the filenames are the same from input and output paths.
          expect(path.basename(inputFilePath)).to.equal(path.basename(outputFilePath));
          switch (path.extname(inputFilePath)) {
            case '.js':
              jsFileCopied = true;
              break;
            case '.map':
              mapFileCopied = true;
              break;
            default:
              throw new Error('Unexpected file extension: ' + inputFilePath);
          }

          return Promise.resolve();
        },
      },
    });

    return copyWorkboxSW('fake-path/')
    .then((workboxSWPath) => {
      let pathSep = path.sep;
      if (path.sep === '\\') {
        pathSep = '\\\\';
      }
      /* eslint-disable no-useless-escape */
      const regexPattern = new RegExp(
        `fake-path${pathSep}workbox-sw\.prod\.v\\d+\.\\d+\.\\d+\.js`);
      /* eslint-enable no-useless-escape */
      if (!workboxSWPath.match(regexPattern)) {
        const details = {regexPattern, workboxSWPath};
        throw new Error(`Unexpected result from copying workboxSW. Details: ${JSON.stringify(details)}`);
      }

      expect(jsFileCopied).to.equal(true);
      expect(mapFileCopied).to.equal(true);
    });
  });
});

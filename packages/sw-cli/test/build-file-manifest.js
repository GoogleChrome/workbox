const proxyquire = require('proxyquire');
const sinon = require('sinon');
const path = require('path');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');
const constants = require('../src/lib/constants.js');

describe('Build File Manifest', function() {
  const INJECTED_ERROR = new Error('Injected Error');
  const globalStubs = [];

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  const checkErrors = (caughtError, errorCode, checkInjectedError) => {
    if (!caughtError) {
      throw new Error('Expected test to throw an error.');
    }

    const captured = cliHelper.endLogCapture();
    captured.consoleLogs.length.should.equal(0);
    captured.consoleWarns.length.should.equal(0);
    captured.consoleErrors.length.should.not.equal(0);

    let foundErrorMsg = false;
    let foundInjectedErrorMsg = false;
    captured.consoleErrors.forEach((errLog) => {
      if (errLog.indexOf(errors[errorCode]) !== -1) {
        foundErrorMsg = true;
      }
      if (errLog.indexOf(INJECTED_ERROR.message) !== -1) {
        foundInjectedErrorMsg = true;
      }
    });
    foundErrorMsg.should.equal(true);
    if (typeof checkInjectedError === 'undefined' ||
      checkInjectedError === true) {
      foundInjectedErrorMsg.should.equal(true);
    }
  };

  describe('Build File Manifest - _getFileHash', function() {
    it('should handle readFileSync Eror', function() {
      const SWCli = proxyquire('../src/cli/index', {
        fs: {
          readFileSync: () => {
            throw INJECTED_ERROR;
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      let caughtError;
      try {
        cli._getFileHash(null);
      } catch (err) {
        caughtError = err;
      }

      checkErrors(caughtError, 'unable-to-get-file-hash');
    });

    it('should return string for valid file', function() {
      const SWCli = proxyquire('../src/cli/index', {
        fs: {
          readFileSync: () => {
            return Buffer.alloc(49);
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      const hash = cli._getFileHash('fake-file.txt');
      if (!hash || typeof hash !== 'string' || hash.length === 0) {
        throw new Error(`Invalid hash value: '${hash}'`);
      }
    });
  });

  describe('Build File Manifest - _getFileSize', function() {
    it('should handle erroring statSync', function() {
      const SWCli = proxyquire('../src/cli/index', {
        fs: {
          statSync: () => {
            throw INJECTED_ERROR;
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      let caughtError;
      try {
        cli._getFileSize('fake-file.txt');
      } catch (err) {
        caughtError = err;
      }

      checkErrors(caughtError, 'unable-to-get-file-size');
    });

    it('should return null for non-files', function() {
      const SWCli = proxyquire('../src/cli/index', {
        fs: {
          statSync: () => {
            return {
              isFile: () => {
                return false;
              },
            };
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      const fileSize = cli._getFileSize('fake-file.txt');
      if (fileSize !== null) {
        throw new Error('For non-files, _getFileSize should return null.');
      }
    });

    it('should be able to get file details', function() {
      const injectedSize = 1234;
      const SWCli = proxyquire('../src/cli/index', {
        fs: {
          statSync: () => {
            return {
              isFile: () => {
                return true;
              },
              size: 1234,
            };
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      const fileSize = cli._getFileSize('fake-file.txt');
      if (fileSize !== injectedSize) {
        throw new Error(`_getFileSize should return ${injectedSize}.`);
      }
    });
  });

  describe('Build File Manifest - _getFileManifestDetails', function() {
    it('should handle glob sync error', function() {
      const SWCli = proxyquire('../src/cli/index', {
        glob: {
          sync: () => {
            throw INJECTED_ERROR;
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      let caughtError;
      try {
        cli._getFileManifestDetails('.', 'fake/glob/pattern/**/*');
      } catch (err) {
        caughtError = err;
      }

      checkErrors(caughtError, 'unable-to-glob-files');
    });

    it('should return array of file details, minus null values', function() {
      const EXAMPLE_DIRECTORY = './EXAMPLE_DIRECTORY';
      const INJECTED_SIZE = 1234;
      const INJECTED_HASH = 'example-hash';

      const OK_FILE_1 = 'ok.txt';
      const OK_FILE_2 = 'ok-2.txt';

      const SWCli = proxyquire('../src/cli/index', {
        glob: {
          sync: () => {
            return [
              OK_FILE_1,
              EXAMPLE_DIRECTORY,
              OK_FILE_2,
            ];
          },
        },
      });

      const sizeStub = sinon.stub(SWCli.prototype, '_getFileSize', (value) => {
        if (value === EXAMPLE_DIRECTORY) {
          return null;
        }
        return INJECTED_SIZE;
      });
      const hashStub = sinon.stub(SWCli.prototype, '_getFileHash', (value) => {
        if (value === EXAMPLE_DIRECTORY) {
          // This should never be called with a directory.
          throw INJECTED_ERROR;
        }
        return INJECTED_HASH;
      });
      globalStubs.push(sizeStub);
      globalStubs.push(hashStub);

      const cli = new SWCli();
      const files = cli._getFileManifestDetails('.', 'fake/glob/pattern/**/*');

      if (files.length !== 2) {
        throw new Error('Directory not filtered from results');
      }

      files.forEach((fileDetails) => {
        fileDetails.size.should.equal(INJECTED_SIZE);
        fileDetails.hash.should.equal(INJECTED_HASH);
        if ([`/${OK_FILE_1}`, `/${OK_FILE_2}`].indexOf(fileDetails.file) === -1) {
          throw new Error('Unexpected Filename: ' + fileDetails.file);
        }
      });
    });
  });

  describe('Build File Manifest - _filterFiles', function() {
    it('should filter out files above maximum size', function() {
      const goodFiles = [
        {
          file: '/ok.txt',
          size: 1234,
          hash: 'example-hash',
        },
        {
          file: '/ok-2.txt',
          size: constants.maximumFileSize,
          hash: 'example-hash-2',
        },
      ];

      const badFile = {
        file: '/not-ok.txt',
        size: constants.maximumFileSize + 1,
        hash: 'example-hash',
      };

      const allFiles = goodFiles.concat(badFile);

      const SWCli = proxyquire('../src/cli/index', {});
      const cli = new SWCli();
      cliHelper.startLogCapture();
      const manifestEntries = cli._filterFiles(allFiles);

      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.not.equal(0);
      captured.consoleErrors.length.should.equal(0);

      manifestEntries.length.should.equal(goodFiles.length);

      manifestEntries.forEach((manifestEntry) => {
        let matchingGoodFile = null;
        goodFiles.forEach((goodFile) => {
          if (goodFile.file === manifestEntry.url) {
            matchingGoodFile = goodFile;
          }
        });
        if (!matchingGoodFile) {
          console.warn(manifestEntry);
          throw new Error('Unable to find matching file for manifest entry: ');
        }

        manifestEntry.url.should.equal(matchingGoodFile.file);
        manifestEntry.revision.should.equal(matchingGoodFile.hash);
      });
    });

    it('should filter manifest and service worker', function() {
      const SW_FILE = '/example/sw.js';
      const MANIFEST_FILE = '/example/manifest.js';

      const goodFiles = [
        {
          file: '/ok.txt',
          size: 1234,
          hash: 'example-hash',
        },
        {
          file: '/ok-2.txt',
          size: constants.maximumFileSize,
          hash: 'example-hash-2',
        },
      ];

      const badFile = [{
        file: SW_FILE,
        size: 10,
        hash: 'example-hash-sw',
      }, {
        file: MANIFEST_FILE,
        size: 12,
        hash: 'example-hash-manifest',
      }];

      const allFiles = goodFiles.concat(badFile);

      const SWCli = proxyquire('../src/cli/index', {});
      const cli = new SWCli();
      // cliHelper.startLogCapture();
      const manifestEntries = cli._filterFiles(allFiles);

      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.not.equal(0);
      captured.consoleErrors.length.should.equal(0);

      manifestEntries.length.should.equal(goodFiles.length);

      manifestEntries.forEach((manifestEntry) => {
        let matchingGoodFile = null;
        goodFiles.forEach((goodFile) => {
          if (goodFile.file === manifestEntry.url) {
            matchingGoodFile = goodFile;
          }
        });
        if (!matchingGoodFile) {
          console.warn(manifestEntry);
          throw new Error('Unable to find matching file for manifest entry: ');
        }

        manifestEntry.url.should.equal(matchingGoodFile.file);
        manifestEntry.revision.should.equal(matchingGoodFile.hash);
      });
    });
  });

  describe('Build File Manifest - _writeFilemanifest', function() {
    it('should handle failing mkdirp.sync', function() {
      const SWCli = proxyquire('../src/cli/index', {
        mkdirp: {
          sync: () => {
            throw INJECTED_ERROR;
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      return cli._writeFilemanifest('fake-path/manifest-name.js')
      .catch((caughtError) => {
        checkErrors(caughtError, 'unable-to-make-manifest-directory');
      });
    });

    it('should handle fs.readFile error when checking template', function() {
      const SWCli = proxyquire('../src/cli/index', {
        mkdirp: {
          sync: () => {
            return;
          },
        },
        fs: {
          readFile: (pathname, encoding, cb) => {
            cb(INJECTED_ERROR);
          },
        },
      });

      cliHelper.startLogCapture();
      const cli = new SWCli();
      return cli._writeFilemanifest('fake-path/manifest-name.js')
      .catch((caughtError) => {
        checkErrors(caughtError, 'read-manifest-template-failure');
      });
    });

    it('should handle error when populating template', function() {
      const SWCli = proxyquire('../src/cli/index', {
        'mkdirp': {
          sync: () => {
            return;
          },
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

      cliHelper.startLogCapture();
      const cli = new SWCli();
      return cli._writeFilemanifest('fake-path/manifest-name.js')
      .catch((caughtError) => {
        checkErrors(caughtError, 'populating-manifest-tmpl-failed');
      });
    });

    it('should handle error writing file', function() {
      const SWCli = proxyquire('../src/cli/index', {
        'mkdirp': {
          sync: () => {
            return;
          },
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

      cliHelper.startLogCapture();
      const cli = new SWCli();
      return cli._writeFilemanifest('fake-path/manifest-name.js')
      .catch((caughtError) => {
        checkErrors(caughtError, 'manifest-file-write-failure');
      });
    });
  });
});

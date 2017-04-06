const proxyquire = require('proxyquire');
const errors = require('../../src/lib/errors.js');

require('chai').should();

describe('lib/write-sw.js', function() {
  const INJECTED_ERROR = new Error('Injected Error');
  const globalStubs = [];

  afterEach(function() {
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  it('should handle failing mkdirp.sync', function() {
    const writeSw = proxyquire('../../src/lib/write-sw', {
      mkdirp: {
        sync: () => {
          throw INJECTED_ERROR;
        },
      },
    });

    return writeSw(
      'fake-path/sw.js',
      [
        {
          url: '/',
          revision: '1234',
        },
      ],
      'fake-path/sw-lib.min.v0.0.0.js',
      'fake-path/')
    .then(() => {
      throw new Error('Expected error to be thrown');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['unable-to-make-sw-directory']) !== 0) {
        throw new Error('Unexpected error thrown: ' + caughtError.message);
      }
    });
  });

  it('should handle fs.readFile error when checking template', function() {
    const writeSw = proxyquire('../../src/lib/write-sw', {
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

    return writeSw(
      'fake-path/sw.js',
      [
        {
          url: '/',
          revision: '1234',
        },
      ],
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .then(() => {
      throw new Error('Expected error to be thrown');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['read-sw-template-failure']) !== 0) {
        throw new Error('Unexpected error thrown: ' + caughtError.message);
      }
    });
  });

  it('should handle error when populating template', function() {
    const writeSw = proxyquire('../../src/lib/write-sw', {
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

    return writeSw(
      'fake-path/sw.js',
      [
        {
          url: '/',
          revision: '1234',
        },
      ],
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .then(() => {
      throw new Error('Expected error to be thrown');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['populating-sw-tmpl-failed']) !== 0) {
        throw new Error('Unexpected error thrown: ' + caughtError.message);
      }
    });
  });

  it('should handle error writing file', function() {
    const writeSw = proxyquire('../../src/lib/write-sw', {
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

    return writeSw(
      'fake-path/sw.js',
      [
        {
          url: '/',
          revision: '1234',
        },
      ],
      'fake-path/sw-lib.min.js',
      'fake-path/')
    .then(() => {
      throw new Error('Expected error to be thrown');
    })
    .catch((caughtError) => {
      if (caughtError.message.indexOf(errors['sw-write-failure']) !== 0) {
        throw new Error('Unexpected error thrown: ' + caughtError.message);
      }
    });
  });
});

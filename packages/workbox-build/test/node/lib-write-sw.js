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

  it('should be able to generate sw for template', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib();
swlib.precache(fileManifest);
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/');
  });

  it('should be able to generate sw for template with cacheId', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib({
  "cacheId": "cache-id-example"
});
swlib.precache(fileManifest);
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        cacheId: 'cache-id-example',
      });
  });

  it('should be able to generate sw for template with directoryIndex', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib({
  "directoryIndex": "custom.html"
});
swlib.precache(fileManifest);
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        directoryIndex: 'custom.html',
      });
  });

  it('should be able to generate sw for template with handleFetch', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib({
  "handleFetch": false
});
swlib.precache(fileManifest);
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        handleFetch: false,
      });
  });

  it('should be able to generate sw for template with skipWaiting', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib({
  "skipWaiting": true
});
swlib.precache(fileManifest);
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        skipWaiting: true,
      });
  });

  it('should be able to generate sw for template with clientsClaim', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib({
  "clientsClaim": true
});
swlib.precache(fileManifest);
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        clientsClaim: true,
      });
  });

  it('should be able to generate sw for template with navigateFallback', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib();
swlib.precache(fileManifest);
swlib.router.registerNavigationRoute("/shell");
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        navigateFallback: '/shell',
      });
  });

  it('should be able to generate sw for template with navigateFallback and whitelist', function() {
      const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib();
swlib.precache(fileManifest);
swlib.router.registerNavigationRoute("/shell", {
  whitelist: [/^\\/guide\\//,/^\\/lolz\\//],
});
`;
      const writeSw = proxyquire('../../src/lib/write-sw', {
        'mkdirp': {
          sync: () => {
            return;
          },
        },
        'fs': {
          writeFile: (filepath, stringToWrite, cb) => {
            if (stringToWrite === EXPECTED_RESULT) {
              cb();
            } else {
              stringToWrite.should.equal(EXPECTED_RESULT);
              cb(new Error('Unexpected result from fs.'));
            }
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
        'fake-path/', {
          navigateFallback: '/shell',
          navigateFallbackWhitelist: [/^\/guide\//, /^\/lolz\//],
        });
    });

  it('should be able to generate sw for template with runtimeCaching', function() {
    const EXPECTED_RESULT = `importScripts('sw-lib.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method precache() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/",
    "revision": "1234"
  }
];

const swlib = new self.goog.SWLib();
swlib.precache(fileManifest);
swlib.router.registerRoute(/^https:\\/\\/example\\.com\\/api/, swlib.strategies.cacheFirst());
swlib.router.registerRoute(/^https:\\/\\/example\\.com\\/api/, swlib.strategies.cacheOnly());
swlib.router.registerRoute(/^https:\\/\\/example\\.com\\/api/, swlib.strategies.networkFirst());
swlib.router.registerRoute(/^https:\\/\\/example\\.com\\/api/, swlib.strategies.networkOnly());
swlib.router.registerRoute(/^https:\\/\\/example\\.com\\/api/, swlib.strategies.staleWhileRevalidate());
swlib.router.registerRoute(/^https:\\/\\/example\\.com\\/api/, swlib.strategies.staleWhileRevalidate());
swlib.router.registerRoute(/images/:size/:name.jpg, (request, values, options) => {
              return new Promise('params: ' + values.join(','));
            });
swlib.router.registerRoute(/\\/articles\\//, swlib.strategies.staleWhileRevalidate({
  "cacheName": "example-cache",
  "cacheExpiration": {
    "maxEntries": 10,
    "maxAgeSeconds": 604800
  },
  "broadcastCacheUpdate": {
    "channelName": "example-channel-name"
  },
  "cacheableResponse": {
    "statuses": [
      0,
      200,
      404
    ],
    "headers": {
      "Example-Header-1": "Header-Value-1",
      "Example-Header-2": "Header-Value-2"
    }
  }
}));
`;
    const writeSw = proxyquire('../../src/lib/write-sw', {
      'mkdirp': {
        sync: () => {
          return;
        },
      },
      'fs': {
        writeFile: (filepath, stringToWrite, cb) => {
          if (stringToWrite === EXPECTED_RESULT) {
            cb();
          } else {
            stringToWrite.should.equal(EXPECTED_RESULT);
            cb(new Error('Unexpected result from fs.'));
          }
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
      'fake-path/', {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/example\.com\/api/,
            handler: 'cacheFirst',
          }, {
            urlPattern: /^https:\/\/example\.com\/api/,
            handler: 'cacheOnly',
          }, {
            urlPattern: /^https:\/\/example\.com\/api/,
            handler: 'networkFirst',
          }, {
            urlPattern: /^https:\/\/example\.com\/api/,
            handler: 'networkOnly',
          }, {
            urlPattern: /^https:\/\/example\.com\/api/,
            handler: 'staleWhileRevalidate',
          }, {
            urlPattern: /^https:\/\/example\.com\/api/,
            handler: 'fastest',
          }, {
            urlPattern: '/images/:size/:name.jpg',
            handler: (request, values, options) => {
              return new Promise('params: ' + values.join(','));
            },
          }, {
            urlPattern: /\/articles\//,
            handler: 'fastest',
            options: {
              cacheName: 'example-cache',
              cacheExpiration: {
                maxEntries: 10,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              broadcastCacheUpdate: {
                channelName: 'example-channel-name',
              },
              cacheableResponse: {
                statuses: [0, 200, 404],
                headers: {
                  'Example-Header-1': 'Header-Value-1',
                  'Example-Header-2': 'Header-Value-2',
                },
              },
            },
          },
        ],
      });
  });
});

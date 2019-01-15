/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const fse = require('fs-extra');
const glob = require('glob');
const path = require('path');
const tempy = require('tempy');

const cdnUtils = require('../../../../packages/workbox-build/src/lib/cdn-utils');
const copyWorkboxLibraries = require('../../../../packages/workbox-build/src/lib/copy-workbox-libraries');
const errors = require('../../../../packages/workbox-build/src/lib/errors');
const generateSW = require('../../../../packages/workbox-build/src/entry-points/generate-sw');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');

describe(`[workbox-build] entry-points/generate-sw.js (End to End)`, function() {
  const WORKBOX_SW_CDN_URL = cdnUtils.getModuleURL('workbox-sw');
  const WORKBOX_DIRECTORY_PREFIX = 'workbox-';
  const GLOB_DIR = path.join(__dirname, '..', '..', 'static', 'example-project-1');
  const BASE_OPTIONS = {
    globDirectory: GLOB_DIR,
    swDest: tempy.file(),
  };
  const REQUIRED_PARAMS = [
    'globDirectory',
    'swDest',
  ];
  const SUPPORTED_PARAMS = [
    'cacheId',
    'clientsClaim',
    'directoryIndex',
    'dontCacheBustURLsMatching',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
    'ignoreURLParametersMatching',
    'importScripts',
    'importWorkboxFrom',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyURLPrefix',
    'offlineGoogleAnalytics',
    'navigateFallback',
    'navigateFallbackWhitelist',
    'runtimeCaching',
    'skipWaiting',
    'templatedURLs',
  ].concat(REQUIRED_PARAMS);
  const UNSUPPORTED_PARAMS = [
    'injectionPointRegexp',
    'swSrc',
  ];

  describe('[workbox-build] required parameters', function() {
    for (const requiredParam of REQUIRED_PARAMS) {
      it(`should reject with a ValidationError when '${requiredParam}' is missing`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        delete options[requiredParam];

        try {
          await generateSW(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(requiredParam);
        }
      });
    }
  });

  describe('[workbox-build] unsupported parameters', function() {
    for (const unsupportedParam of UNSUPPORTED_PARAMS) {
      it(`should reject with a ValidationError when '${unsupportedParam}' is present`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        options[unsupportedParam] = unsupportedParam;

        try {
          await generateSW(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(unsupportedParam);
        }
      });
    }
  });

  describe('[workbox-build] invalid parameter values', function() {
    for (const param of SUPPORTED_PARAMS) {
      it(`should reject with a ValidationError when '${param}' is null`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        options[param] = null;

        try {
          await generateSW(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(param);
        }
      });
    }
  });

  describe(`[workbox-build] writing a service worker file`, function() {
    it(`should use defaults when all the required parameters are present`, async function() {
      const swDest = tempy.file();
      const options = Object.assign({}, BASE_OPTIONS, {swDest});

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
      }});
    });

    it(`should use defaults and make local copies of the Workbox libraries when importWorkboxFrom is 'local'`, async function() {
      const swDest = path.join(tempy.directory(), 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        importWorkboxFrom: 'local',
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      // Validate the copied library files.
      const libraryFiles = glob.sync(`${WORKBOX_DIRECTORY_PREFIX}*/*.js*`,
          {cwd: path.dirname(swDest)});

      const modulePathPrefix = path.dirname(libraryFiles[0]);

      const basenames = libraryFiles.map((file) => path.basename(file));
      expect(basenames).to.eql([
        'workbox-background-sync.dev.js',
        'workbox-background-sync.dev.js.map',
        'workbox-background-sync.prod.js',
        'workbox-background-sync.prod.js.map',
        'workbox-broadcast-cache-update.dev.js',
        'workbox-broadcast-cache-update.dev.js.map',
        'workbox-broadcast-cache-update.prod.js',
        'workbox-broadcast-cache-update.prod.js.map',
        'workbox-cache-expiration.dev.js',
        'workbox-cache-expiration.dev.js.map',
        'workbox-cache-expiration.prod.js',
        'workbox-cache-expiration.prod.js.map',
        'workbox-cacheable-response.dev.js',
        'workbox-cacheable-response.dev.js.map',
        'workbox-cacheable-response.prod.js',
        'workbox-cacheable-response.prod.js.map',
        'workbox-core.dev.js',
        'workbox-core.dev.js.map',
        'workbox-core.prod.js',
        'workbox-core.prod.js.map',
        'workbox-navigation-preload.dev.js',
        'workbox-navigation-preload.dev.js.map',
        'workbox-navigation-preload.prod.js',
        'workbox-navigation-preload.prod.js.map',
        'workbox-offline-ga.dev.js',
        'workbox-offline-ga.dev.js.map',
        'workbox-offline-ga.prod.js',
        'workbox-offline-ga.prod.js.map',
        'workbox-precaching.dev.js',
        'workbox-precaching.dev.js.map',
        'workbox-precaching.prod.js',
        'workbox-precaching.prod.js.map',
        'workbox-range-requests.dev.js',
        'workbox-range-requests.dev.js.map',
        'workbox-range-requests.prod.js',
        'workbox-range-requests.prod.js.map',
        'workbox-routing.dev.js',
        'workbox-routing.dev.js.map',
        'workbox-routing.prod.js',
        'workbox-routing.prod.js.map',
        'workbox-strategies.dev.js',
        'workbox-strategies.dev.js.map',
        'workbox-strategies.prod.js',
        'workbox-strategies.prod.js.map',
        'workbox-streams.dev.js',
        'workbox-streams.dev.js.map',
        'workbox-streams.prod.js',
        'workbox-streams.prod.js.map',
        'workbox-sw.js',
        'workbox-sw.js.map',
      ]);


      // The correct importScripts path should use the versioned name of the
      // parent workbox libraries directory. We don't know that version ahead
      // of time, so we ensure that there's a match based on what actually
      // got copied over.
      const workboxSWImport = libraryFiles.filter(
          (file) => file.endsWith('workbox-sw.js'));

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [workboxSWImport],
        setConfig: [[{modulePathPrefix}]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
      }});
    });

    it(`should not include the copied Workbox libraries in the precacheAndRoute manifest`, async function() {
      const testFileContents = 'test';
      const globDirectory = tempy.directory();
      // We need at least one non-Workbox library file in the source directory.
      await fse.writeFile(path.join(globDirectory, 'index.html'), testFileContents);

      // Make two copies of the Workbox libraries into the source directory, to
      // test the globIgnore pattern works for both top and sub-directories.
      await copyWorkboxLibraries(globDirectory);
      await copyWorkboxLibraries(path.join(globDirectory, 'sub-directory'));

      const swDest = path.join(tempy.directory(), 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        swDest,
        importWorkboxFrom: 'local',
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(1);
      expect(size).to.eql(testFileContents.length);
    });

    it(`should use defaults when all the required parameters are present, with additional importScripts`, async function() {
      const swDest = path.join(tempy.directory(), 'sw.js');
      const importScripts = ['manifest.js'];
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL], [...importScripts]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional configuration`, async function() {
      const swDest = tempy.file();
      const directoryIndex = 'test.html';
      const ignoreURLParametersMatching = [/test1/, /test2/];
      const cacheId = 'test';
      const additionalOptions = {
        cacheId,
        directoryIndex,
        ignoreURLParametersMatching,
        clientsClaim: true,
        skipWaiting: true,
      };
      const options = Object.assign({}, BASE_OPTIONS, additionalOptions, {swDest});

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        clientsClaim: [[]],
        skipWaiting: [[]],
        setCacheNameDetails: [[{prefix: cacheId}]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {directoryIndex, ignoreURLParametersMatching}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'navigateFallback' and 'navigateFallbackWhitelist'`, async function() {
      const swDest = tempy.file();
      const navigateFallback = 'test.html';
      const navigateFallbackWhitelist = [/test1/, /test2/];
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
        navigateFallbackWhitelist,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        registerNavigationRoute: [[navigateFallback, {
          whitelist: navigateFallbackWhitelist,
        }]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with symlinks`, async function() {
      const swDest = tempy.file();
      const globDirectory = tempy.directory();

      await fse.ensureSymlink(GLOB_DIR, path.join(globDirectory, 'link'));

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'link/index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'link/page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'link/page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'link/styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'link/styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'link/webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'globFollow' and  symlinks`, async function() {
      const swDest = tempy.file();
      const globDirectory = tempy.directory();

      await fse.ensureSymlink(GLOB_DIR, path.join(globDirectory, 'link'));

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        globFollow: false,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(4);
      expect(size).to.eql(2535);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'link/index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'link/page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'link/page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'link/webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to true`, async function() {
      const swDest = tempy.file();
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        offlineGoogleAnalytics: true,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        googleAnalyticsInitialize: [[{}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to a config`, async function() {
      const swDest = tempy.file();
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        offlineGoogleAnalytics: {
          parameterOverrides: {
            cd1: 'offline',
          },
        },
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        googleAnalyticsInitialize: [[{
          parameterOverrides: {
            cd1: 'offline',
          },
        }]],
      }});
    });
  });

  describe(`[workbox-build] behavior with 'runtimeCaching'`, function() {
    const DEFAULT_METHOD = 'GET';
    const REGEXP_URL_PATTERN = /test/;
    const STRING_URL_PATTERN = '/test';
    const STRING_HANDLER = 'CacheFirst';
    const FUNCTION_URL_PATTERN = (params) => true;

    it(`should reject when 'urlPattern' is missing from 'runtimeCaching'`, async function() {
      const handler = STRING_HANDLER;
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{handler}],
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('urlPattern');
      }
    });

    it(`should reject when 'handler' is missing from 'runtimeCaching'`, async function() {
      const urlPattern = REGEXP_URL_PATTERN;
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{urlPattern}],
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('handler');
      }
    });

    it(`should reject when 'handler' is not a valid strategy name`, async function() {
      const urlPattern = REGEXP_URL_PATTERN;
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{
          urlPattern,
          handler: 'invalid',
        }],
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('handler');
      }
    });

    it(`should support a single string 'urlPattern' and a string 'handler'`, async function() {
      const swDest = tempy.file();
      const runtimeCaching = [{
        urlPattern: STRING_URL_PATTERN,
        handler: STRING_HANDLER,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [STRING_HANDLER]: [[]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        registerRoute: [[STRING_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD]],
      }});
    });

    it(`should support a single function 'urlPattern' and a string 'handler'`, async function() {
      const swDest = tempy.file();
      const runtimeCaching = [{
        urlPattern: FUNCTION_URL_PATTERN,
        handler: STRING_HANDLER,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [STRING_HANDLER]: [[]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        // We need to stringify the function to get it to pass validation.
        // The service-worker-runtime.js validator will do the same.
        // See https://github.com/chaijs/chai/issues/697
        registerRoute: [[FUNCTION_URL_PATTERN.toString(), {name: STRING_HANDLER}, DEFAULT_METHOD]],
      }});
    });

    it(`should support setting individual 'options' each, for multiple 'runtimeCaching' entries`, async function() {
      const swDest = tempy.file();
      const firstRuntimeCachingOptions = {
        cacheName: 'first-cache-name',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 1,
          purgeOnQuotaError: false,
        },
      };
      const secondRuntimeCachingOptions = {
        cacheName: 'second-cache-name',
        cacheableResponse: {
          headers: {
            'X-Test': 'test',
          },
          statuses: [0, 200],
        },
      };
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
        options: firstRuntimeCachingOptions,
      }, {
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
        options: secondRuntimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [STRING_HANDLER]: [[{
          cacheName: firstRuntimeCachingOptions.cacheName,
          plugins: [{}],
        }], [{
          cacheName: secondRuntimeCachingOptions.cacheName,
          plugins: [{}],
        }]],
        cacheableResponsePlugin: [[secondRuntimeCachingOptions.cacheableResponse]],
        cacheExpirationPlugin: [[firstRuntimeCachingOptions.expiration]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        registerRoute: [
          [REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD],
          [REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD],
        ],
      }});
    });

    it(`should reject with a ValidationError when 'networkTimeoutSeconds' is used and handler is not 'NetworkFirst'`, async function() {
      const swDest = tempy.file();
      const runtimeCachingOptions = {
        networkTimeoutSeconds: 1,
      };
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: 'NetworkOnly',
        options: runtimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.message).to.include(errors['invalid-network-timeout-seconds']);
      }
    });

    it(`should support 'networkTimeoutSeconds' when handler is 'NetworkFirst'`, async function() {
      const swDest = tempy.file();
      const networkTimeoutSeconds = 1;
      const handler = 'NetworkFirst';

      const runtimeCachingOptions = {
        networkTimeoutSeconds,
        plugins: [],
      };
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler,
        options: runtimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [handler]: [[runtimeCachingOptions]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precacheAndRoute: [[[{
          url: 'index.html',
          revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
        }, {
          url: 'page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: 'page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: 'styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: 'styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        }, {
          url: 'webpackEntry.js',
          revision: '5b652181a25e96f255d0490203d3c47e',
        }], {}]],
        registerRoute: [
          [REGEXP_URL_PATTERN, {name: handler}, DEFAULT_METHOD],
        ],
      }});
    });

    it(`should reject when 'options.expiration' is used without 'options.cacheName'`, async function() {
      const urlPattern = REGEXP_URL_PATTERN;
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{
          urlPattern,
          handler: 'NetworkFirst',
          options: {
            expiration: {
              maxEntries: 5,
            },
          },
        }],
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('expiration');
      }
    });
  });

  describe(`[workbox-build] deprecated options`, function() {
    const oldOptionsToValue = {
      dontCacheBustUrlsMatching: /ignored/,
      ignoreUrlParametersMatching: [/ignored/],
      modifyUrlPrefix: {
        'ignored': 'ignored',
      },
      templatedUrls: {},
    };

    for (const [option, value] of Object.entries(oldOptionsToValue)) {
      it(`should return a warning when ${option} is used`, async function() {
        const options = Object.assign({}, BASE_OPTIONS, {
          [option]: value,
        });

        const {warnings} = await generateSW(options);
        expect(warnings).to.have.length(1);
      });
    }
  });
});

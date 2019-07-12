/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const fse = require('fs-extra');
const path = require('path');
const tempy = require('tempy');

const confirmDirectoryContains = require('../../../../infra/testing/confirm-directory-contains');
const errors = require('../../../../packages/workbox-build/src/lib/errors');
const generateSW = require('../../../../packages/workbox-build/src/entry-points/generate-sw');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');

describe(`[workbox-build] entry-points/generate-sw.js (End to End)`, function() {
  const GLOB_DIR = path.join(__dirname, '..', '..', 'static', 'example-project-1');
  const BASE_OPTIONS = {
    globDirectory: GLOB_DIR,
    inlineWorkboxRuntime: false,
    mode: 'development',
    swDest: tempy.file({extension: 'js'}),
  };
  const REQUIRED_PARAMS = [
    'globDirectory',
    'swDest',
  ];
  const SUPPORTED_PARAMS = [
    'babelPresetEnvTargets',
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
    'inlineWorkboxRuntime',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'mode',
    'modifyURLPrefix',
    'navigateFallback',
    'navigateFallbackWhitelist',
    'navigationPreload',
    'offlineGoogleAnalytics',
    'runtimeCaching',
    'skipWaiting',
    'sourcemap',
    'templatedURLs',
  ].concat(REQUIRED_PARAMS);
  const UNSUPPORTED_PARAMS = [
    'injectionPoint',
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
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {swDest});

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-9eb92ebe']],
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

    it(`should use defaults when all the required parameters are present, with additional importScripts`, async function() {
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const importScripts = ['manifest.js'];
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        swDest,
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-9eb92ebe'], [...importScripts]],
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
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
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

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-4a41d90a']],
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
      }, addEventListenerValidation: (addEventListenerStub) => {
        // When skipWaiting is true, the 'message' addEventListener shouldn't be called.
        expect(addEventListenerStub.called).to.be.false;
      }});
    });

    it(`should add a 'message' event listener when 'skipWaiting: false'`, async function() {
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const additionalOptions = {
        skipWaiting: false,
      };
      const options = Object.assign({}, BASE_OPTIONS, additionalOptions, {swDest});

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-9eb92ebe']],
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
      }, addEventListenerValidation: (addEventListenerStub) => {
        expect(addEventListenerStub.calledOnce).to.be.true;
        expect(addEventListenerStub.firstCall.args[0]).to.eql('message');
        // This isn't the *cleanest* possible way of testing the message event
        // handler, but given the constraints of this node-based environment,
        // it seems the most effective way to ensure the right code gets run.
        expect(addEventListenerStub.firstCall.args[1].toString()).to.eql(`event => {\n    if (event.data && event.data.type === 'SKIP_WAITING') {\n      self.skipWaiting();\n    }\n  }`);
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'navigateFallback' and 'navigateFallbackWhitelist'`, async function() {
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const navigateFallback = 'test.html';
      const navigateFallbackWhitelist = [/test1/, /test2/];
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
        navigateFallbackWhitelist,
        swDest,
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        getCacheKeyForURL: [[navigateFallback]],
        importScripts: [['./workbox-808eb12e']],
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
        registerNavigationRoute: [['/urlWithCacheKey', {
          whitelist: navigateFallbackWhitelist,
        }]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with symlinks`, async function() {
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const globDirectory = tempy.directory();

      await fse.ensureSymlink(GLOB_DIR, path.join(globDirectory, 'link'));

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        swDest,
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-9eb92ebe']],
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
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const globDirectory = tempy.directory();

      await fse.ensureSymlink(GLOB_DIR, path.join(globDirectory, 'link'));

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        globFollow: false,
        swDest,
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(4);
      expect(size).to.eql(2535);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-9eb92ebe']],
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
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        offlineGoogleAnalytics: true,
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-76e7a865']],
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
        initialize: [[{}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to a config`, async function() {
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        offlineGoogleAnalytics: {
          parameterOverrides: {
            cd1: 'offline',
          },
        },
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);

      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./workbox-76e7a865']],
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
        initialize: [[{
          parameterOverrides: {
            cd1: 'offline',
          },
        }]],
      }});
    });

    it(`should inline the Workbox runtime when 'inlineWorkboxRuntime' is true`, async function() {
      const outputDir = tempy.directory();
      const swDest = path.join(outputDir, 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        inlineWorkboxRuntime: true,
      });

      const {count, filePaths, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);

      confirmDirectoryContains(outputDir, filePaths);
      // We can't validate the generated sw.js file, unfortunately.
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
      const swDest = tempy.file({extension: 'js'});
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
        importScripts: [['./workbox-b880c8c0']],
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
      const swDest = tempy.file({extension: 'js'});
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
        importScripts: [['./workbox-b880c8c0']],
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
        // See https://github.com/chaijs/chai/issues/697
        registerRoute: [['params => true', {name: STRING_HANDLER}, DEFAULT_METHOD]],
      }});
    });

    it(`should support setting individual 'options' each, for multiple 'runtimeCaching' entries`, async function() {
      const swDest = tempy.file({extension: 'js'});
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
        Plugin: [[firstRuntimeCachingOptions.expiration]],
        Plugin$1: [[secondRuntimeCachingOptions.cacheableResponse]],
        importScripts: [['./workbox-aad11b65']],
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
      const swDest = tempy.file({extension: 'js'});
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
      const swDest = tempy.file({extension: 'js'});
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
        importScripts: [['./workbox-44e55206']],
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

  describe(`[workbox-build] behavior with 'navigationPreload'`, function() {
    it(`should reject with a ValidationError when 'navigationPreload' is true and 'runtimeCaching' is undefined`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        navigationPreload: true,
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('runtimeCaching');
      }
    });

    it(`should reject with a ValidationError when 'navigationPreload' is true and 'runtimeCaching' is undefined`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: 'invalid',
        navigationPreload: true,
      });

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('runtimeCaching');
      }
    });

    it(`should generate when 'navigationPreload' is true and 'runtimeCaching' is valid`, async function() {
      const swDest = tempy.file({extension: 'js'});
      const urlPattern = /test/;
      const handler = 'CacheFirst';
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        runtimeCaching: [{urlPattern, handler}],
        navigationPreload: true,
      });

      const {count, size, warnings} = await generateSW(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [handler]: [[]],
        importScripts: [['./workbox-1229ecdd']],
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
        enable: [[]],
        registerRoute: [[urlPattern, {name: handler}, 'GET']],
      }});
    });
  });

  describe(`[workbox-build] removed options`, function() {
    // These were deprecated in v4, and formally removed in v5.
    const oldOptionsToValue = {
      dontCacheBustUrlsMatching: /ignored/,
      ignoreUrlParametersMatching: [/ignored/],
      modifyUrlPrefix: {
        'ignored': 'ignored',
      },
      templatedUrls: {},
    };

    for (const [option, value] of Object.entries(oldOptionsToValue)) {
      it(`should fail validation when ${option} is used`, async function() {
        const options = Object.assign({}, BASE_OPTIONS, {
          [option]: value,
        });

        try {
          await generateSW(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(option);
        }
      });
    }

    it(`should fail validation when a strategy function (lowercase) name is used`, async function() {
      const runtimeCaching = [{
        urlPattern: /abc/,
        handler: 'cacheFirst',
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      try {
        await generateSW(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('handler');
      }
    });
  });
});

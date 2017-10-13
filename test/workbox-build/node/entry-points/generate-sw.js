const expect = require('chai').expect;
const fse = require('fs-extra');
const path = require('path');
const tempy = require('tempy');

const cdnUtils = require('../../../../packages/workbox-build/src/lib/cdn-utils');
const generateSW = require('../../../../packages/workbox-build/src/entry-points/generate-sw');
const useBuildType = require('../../../../packages/workbox-build/src/lib/use-build-type');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');

describe(`[workbox-build] entry-points/generate-sw.js (End to End)`, function() {
  const BUILD_TYPE = (process.env.NODE_ENV && process.env.NODE_ENV.startsWith('dev')) ? 'dev' : 'prod';
  const WORKBOX_SW_CDN_URL = cdnUtils.getModuleUrl('workbox-sw', BUILD_TYPE);
  const LOCAL_WORKBOX_SW_FILENAME = useBuildType(
    path.basename(require.resolve('../../../../packages/workbox-build/node_modules/workbox-sw/')),
    BUILD_TYPE
  );
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
    'dontCacheBustUrlsMatching',
    'globIgnores',
    'globPatterns',
    'handleFetch',
    'ignoreUrlParametersMatching',
    'importScripts',
    'importWorkboxFromCDN',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyUrlPrefix',
    'navigateFallback',
    'navigateFallbackWhitelist',
    'runtimeCaching',
    'skipWaiting',
    'templatedUrls',

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

      const {count, size} = await generateSW(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
      }});
    });

    it(`should use defaults and call importScripts() with a copy of workbox-sw when importWorkboxFromCDN is false`, async function() {
      const swDest = path.join(tempy.directory(), 'sw.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        importWorkboxFromCDN: false,
      });

      const {count, size} = await generateSW(options);

      const pathToWorkboxSWCopy = path.join(path.dirname(swDest), LOCAL_WORKBOX_SW_FILENAME);
      const stats = await fse.stat(pathToWorkboxSWCopy);
      expect(stats.isFile()).to.be.true;

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[LOCAL_WORKBOX_SW_FILENAME]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional importScripts`, async function() {
      const swDest = path.join(tempy.directory(), 'sw.js');
      const importScripts = ['manifest.js'];
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        swDest,
      });

      const {count, size} = await generateSW(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[...importScripts, WORKBOX_SW_CDN_URL]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional WorkboxSW() configuration`, async function() {
      const swDest = tempy.file();
      const workboxSWOptions = {
        cacheId: 'test',
        clientsClaim: true,
        directoryIndex: 'test.html',
        handleFetch: false,
        ignoreUrlParametersMatching: [/test1/, /test2/],
        skipWaiting: true,
      };
      const options = Object.assign({}, BASE_OPTIONS, workboxSWOptions, {swDest});

      const {count, size} = await generateSW(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        constructor: [[workboxSWOptions]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
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

      const {count, size} = await generateSW(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
        registerNavigationRoute: [[navigateFallback, {
          whitelist: navigateFallbackWhitelist,
        }]],
      }});
    });
  });

  describe(`[workbox-build] behavior with 'runtimeCaching'`, function() {
    const DEFAULT_METHOD = 'GET';
    const STRING_URL_PATTERN = 'test';
    const REGEXP_URL_PATTERN = /test/;
    const STRING_HANDLER = 'cacheFirst';

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

      const {count, size} = await generateSW(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [STRING_HANDLER]: [[{}]],
        constructor: [[{}]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
        registerRoute: [[STRING_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD]],
      }});
    });

    it(`should support setting individual 'options' each, for multiple 'runtimeCaching' entries`, async function() {
      const swDest = tempy.file();
      const firstRuntimeCachingOptions = {
        cacheName: 'first-cache-name',
        cacheExpiration: {
          maxEntries: 1,
          maxAgeSeconds: 1,
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
        urlPattern: STRING_URL_PATTERN,
        handler: STRING_HANDLER,
        options: secondRuntimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      });

      const {count, size} = await generateSW(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        [STRING_HANDLER]: [[firstRuntimeCachingOptions], [secondRuntimeCachingOptions]],
        constructor: [[{}]],
        importScripts: [[WORKBOX_SW_CDN_URL]],
        precache: [[[{
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }]]],
        registerRoute: [
          [REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD],
          [STRING_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD],
        ],
      }});
    });
  });
});

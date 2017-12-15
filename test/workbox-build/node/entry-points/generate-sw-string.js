const expect = require('chai').expect;
const path = require('path');

const generateSWString = require('../../../../packages/workbox-build/src/entry-points/generate-sw-string');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');

describe(`[workbox-build] entry-points/generate-sw-string.js (End to End)`, function() {
  const GLOB_DIR = path.join(__dirname, '..', '..', 'static', 'example-project-1');
  const DEFAULT_IMPORT_SCRIPTS = ['workbox.js'];
  const BASE_OPTIONS = {
    importScripts: DEFAULT_IMPORT_SCRIPTS,
  };
  const REQUIRED_PARAMS = [
    'importScripts',
  ];
  const SUPPORTED_PARAMS = [
    'cacheId',
    'clientsClaim',
    'directoryIndex',
    'dontCacheBustUrlsMatching',
    'globDirectory',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
    'ignoreUrlParametersMatching',
    'injectionPointRegexp',
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
    'importWorkboxFrom',
    'injectionPointRegexp',
    'swDest',
    'swSrc',
  ];

  describe('[workbox-build] required parameters', function() {
    for (const requiredParam of REQUIRED_PARAMS) {
      it(`should reject with a ValidationError when '${requiredParam}' is missing`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        delete options[requiredParam];

        try {
          await generateSWString(options);
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
          await generateSWString(options);
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
          await generateSWString(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(param);
        }
      });
    }
  });

  describe(`[workbox-build] behavior without 'runtimeCaching'`, function() {
    it(`should use defaults when all the required parameters are present`, async function() {
      const options = Object.assign({}, BASE_OPTIONS);

      const swCode = await generateSWString(options);
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional code via importScripts`, async function() {
      const importScripts = DEFAULT_IMPORT_SCRIPTS.concat('manifest.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
      });

      let swCode = await generateSWString(options);

      // Rather than emulate importScripts() logic in the validator, we're just
      // going to inject some additional code at the start of the generated
      // service worker, and pretend that it's the code in 'manifest.js'.
      const additionalManifestEntries = [{
        url: '/test',
        revision: 'test',
      }];
      swCode = `self.__precacheManifest = ${JSON.stringify(additionalManifestEntries)};${swCode}`;
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        importScripts: [[...importScripts]],
        suppressWarnings: [[]],
        precacheAndRoute: [[additionalManifestEntries, {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, using local files and additional code via importScripts`, async function() {
      const importScripts = DEFAULT_IMPORT_SCRIPTS.concat('manifest.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        globDirectory: GLOB_DIR,
        globPatterns: ['**/*.{js,css,html}'],
      });

      let swCode = await generateSWString(options);

      // Rather than emulate importScripts() logic in the validator, we're just
      // going to inject some additional code at the start of the generated
      // service worker, and pretend that it's the code in 'manifest.js'.
      const additionalManifestEntries = [{
        url: '/test',
        revision: 'test',
      }];
      swCode = `self.__precacheManifest = ${JSON.stringify(additionalManifestEntries)};${swCode}`;
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        importScripts: [[...importScripts]],
        suppressWarnings: [[]],
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
          revision: 'd41d8cd98f00b204e9800998ecf8427e',
        }].concat(additionalManifestEntries), {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional WorkboxSW() configuration`, async function() {
      const cacheId = 'test';
      const directoryIndex = 'test.html';
      const ignoreUrlParametersMatching = [/test1/, /test2/];

      const workboxOptions = {
        cacheId,
        directoryIndex,
        ignoreUrlParametersMatching,
        clientsClaim: true,
        skipWaiting: true,
      };
      const options = Object.assign({}, BASE_OPTIONS, workboxOptions);

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        clientsClaim: [[]],
        skipWaiting: [[]],
        setCacheNameDetails: [[{prefix: cacheId}]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {directoryIndex, ignoreUrlParametersMatching}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'navigateFallback'`, async function() {
      const navigateFallback = 'test.html';
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
      });

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerNavigationRoute: [[navigateFallback]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'navigateFallback' and 'navigateFallbackWhitelist'`, async function() {
      const navigateFallback = 'test.html';
      const navigateFallbackWhitelist = [/test1/, /test2/];
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
        navigateFallbackWhitelist,
      });

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerNavigationRoute: [[navigateFallback, {
          whitelist: navigateFallbackWhitelist,
        }]],
      }});
    });
  });

  describe(`[workbox-build] behavior with 'runtimeCaching'`, function() {
    const DEFAULT_METHOD = 'GET';
    const STRING_URL_PATTERN = '/test';
    const REGEXP_URL_PATTERN = /test/;
    const STRING_HANDLER = 'cacheFirst';

    it(`should reject when 'urlPattern' is missing from 'runtimeCaching'`, async function() {
      const handler = STRING_HANDLER;
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{handler}],
      });

      try {
        await generateSWString(options);
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
        await generateSWString(options);
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
        await generateSWString(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('handler');
      }
    });

    it(`should support a single string 'urlPattern' and a string 'handler'`, async function() {
      const runtimeCaching = [{
        urlPattern: STRING_URL_PATTERN,
        handler: STRING_HANDLER,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const swCode = await generateSWString(options);
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        [STRING_HANDLER]: [[]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [[STRING_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD]],
      }});
    });

    it(`should support a single RegExp 'urlPattern' and a string 'handler'`, async function() {
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        [STRING_HANDLER]: [[]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [[REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD]],
      }});
    });

    it(`should support multiple entries in 'runtimeCaching'`, async function() {
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
      }, {
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        [STRING_HANDLER]: [[], []],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [
          [REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD],
          [REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD],
        ],
      }});
    });

    it(`should reject when one of the 'runtimeCaching' entries has invalid 'options'`, async function() {
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
        options: null,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      try {
        await generateSWString(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('options');
      }
    });

    it(`should support setting all of the supported 'options' for a single 'runtimeCaching' entry`, async function() {
      const runtimeCachingOptions = {
        cacheName: 'test-cache-name',
        plugins: [{}, {}],
        cacheExpiration: {
          maxEntries: 1,
          maxAgeSeconds: 1,
        },
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
        options: runtimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        [STRING_HANDLER]: [[{
          cacheName: runtimeCachingOptions.cacheName,
          plugins: runtimeCachingOptions.plugins.concat([
            'workbox.expiration.Plugin',
            'workbox.cacheableResponse.Plugin',
          ]),
        }]],
        cacheableResponsePlugin: [[runtimeCachingOptions.cacheableResponse]],
        cacheExpirationPlugin: [[runtimeCachingOptions.cacheExpiration]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [[REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD]],
      }});
    });

    it(`should support setting individual 'options' each, for multiple 'runtimeCaching' entries`, async function() {
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
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
        options: secondRuntimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const swCode = await generateSWString(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        [STRING_HANDLER]: [[{
          cacheName: firstRuntimeCachingOptions.cacheName,
          plugins: ['workbox.expiration.Plugin'],
        }], [{
          cacheName: secondRuntimeCachingOptions.cacheName,
          plugins: ['workbox.cacheableResponse.Plugin'],
        }]],
        cacheableResponsePlugin: [[secondRuntimeCachingOptions.cacheableResponse]],
        cacheExpirationPlugin: [[firstRuntimeCachingOptions.cacheExpiration]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        suppressWarnings: [[]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [
          [REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD],
          [REGEXP_URL_PATTERN, STRING_HANDLER, DEFAULT_METHOD],
        ],
      }});
    });
  });
});

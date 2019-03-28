/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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
    'dontCacheBustURLsMatching',
    'globDirectory',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
    'ignoreURLParametersMatching',
    'injectionPointRegexp',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyURLPrefix',
    'navigateFallback',
    'navigateFallbackWhitelist',
    'navigationPreload',
    'offlineGoogleAnalytics',
    'runtimeCaching',
    'skipWaiting',
    'templatedURLs',
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

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional code via importScripts`, async function() {
      const importScripts = DEFAULT_IMPORT_SCRIPTS.concat('manifest.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
      });

      let {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      // Rather than emulate importScripts() logic in the validator, we're just
      // going to inject some additional code at the start of the generated
      // service worker, and pretend that it's the code in 'manifest.js'.
      const additionalManifestEntries = [{
        url: '/test',
        revision: 'test',
      }];
      swString = `self.__precacheManifest = ${JSON.stringify(additionalManifestEntries)};${swString}`;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        importScripts: [[...importScripts]],
        precacheAndRoute: [[additionalManifestEntries, {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, using local files and additional code via importScripts`, async function() {
      const importScripts = DEFAULT_IMPORT_SCRIPTS.concat('manifest.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        globDirectory: GLOB_DIR,
      });

      let {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      // Rather than emulate importScripts() logic in the validator, we're just
      // going to inject some additional code at the start of the generated
      // service worker, and pretend that it's the code in 'manifest.js'.
      const additionalManifestEntries = [{
        url: '/test',
        revision: 'test',
      }];
      swString = `self.__precacheManifest = ${JSON.stringify(additionalManifestEntries)};${swString}`;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        importScripts: [[...importScripts]],
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
        }].concat(additionalManifestEntries), {}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional WorkboxSW() configuration`, async function() {
      const cacheId = 'test';
      const directoryIndex = 'test.html';
      const ignoreURLParametersMatching = [/test1/, /test2/];

      const workboxOptions = {
        cacheId,
        directoryIndex,
        ignoreURLParametersMatching,
        clientsClaim: true,
        skipWaiting: true,
      };
      const options = Object.assign({}, BASE_OPTIONS, workboxOptions);

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        clientsClaim: [[]],
        skipWaiting: [[]],
        setCacheNameDetails: [[{prefix: cacheId}]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {directoryIndex, ignoreURLParametersMatching}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'navigateFallback'`, async function() {
      const navigateFallback = 'test.html';
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
      });

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        getCacheKeyForURL: [[navigateFallback]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerNavigationRoute: [['/urlWithCacheKey']],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'navigateFallback' and 'navigateFallbackWhitelist'`, async function() {
      const navigateFallback = 'test.html';
      const navigateFallbackWhitelist = [/test1/, /test2/];
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
        navigateFallbackWhitelist,
      });

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        getCacheKeyForURL: [[navigateFallback]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerNavigationRoute: [['/urlWithCacheKey', {
          whitelist: navigateFallbackWhitelist,
        }]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to true`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        offlineGoogleAnalytics: true,
      });

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        googleAnalyticsInitialize: [[{}]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to a config`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        offlineGoogleAnalytics: {
          parameterOverrides: {
            cd1: 'offline',
          },
        },
      });

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
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
    const STRING_URL_PATTERN = '/test';
    const REGEXP_URL_PATTERN = /test/;
    const STRING_HANDLER = 'CacheFirst';

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

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;

      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        [STRING_HANDLER]: [[]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [[STRING_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD]],
      }});
    });

    it(`should support a single RegExp 'urlPattern' and a string 'handler'`, async function() {
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        [STRING_HANDLER]: [[]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [[REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD]],
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

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        [STRING_HANDLER]: [[], []],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [
          [REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD],
          [REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD],
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
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 1,
          purgeOnQuotaError: false,
        },
        cacheableResponse: {
          headers: {
            'X-Test': 'test',
          },
          statuses: [0, 200],
        },
        fetchOptions: {},
        matchOptions: {},
      };
      const runtimeCaching = [{
        urlPattern: REGEXP_URL_PATTERN,
        handler: STRING_HANDLER,
        options: runtimeCachingOptions,
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        [STRING_HANDLER]: [[{
          cacheName: runtimeCachingOptions.cacheName,
          plugins: runtimeCachingOptions.plugins.concat([
            {}, {},
          ]),
          fetchOptions: {},
          matchOptions: {},
        }]],
        cacheableResponsePlugin: [[runtimeCachingOptions.cacheableResponse]],
        cacheExpirationPlugin: [[runtimeCachingOptions.expiration]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [[REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD]],
      }});
    });

    it(`should support setting individual 'options' each, for multiple 'runtimeCaching' entries`, async function() {
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
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;
      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        [STRING_HANDLER]: [[{
          cacheName: firstRuntimeCachingOptions.cacheName,
          plugins: [{}],
        }], [{
          cacheName: secondRuntimeCachingOptions.cacheName,
          plugins: [{}],
        }]],
        cacheableResponsePlugin: [[secondRuntimeCachingOptions.cacheableResponse]],
        cacheExpirationPlugin: [[firstRuntimeCachingOptions.expiration]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        registerRoute: [
          [REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD],
          [REGEXP_URL_PATTERN, {name: STRING_HANDLER}, DEFAULT_METHOD],
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
        await generateSWString(options);
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
        await generateSWString(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('runtimeCaching');
      }
    });

    it(`should reject with a ValidationError when 'navigationPreload' is true and 'runtimeCaching' is malformed`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: 'invalid',
        navigationPreload: true,
      });

      try {
        await generateSWString(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.name).to.eql('ValidationError');
        expect(error.details[0].context.key).to.eql('runtimeCaching');
      }
    });

    it(`should generate when 'navigationPreload' is true and 'runtimeCaching' is valid`, async function() {
      const urlPattern = /test/;
      const handler = 'CacheFirst';
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{urlPattern, handler}],
        navigationPreload: true,
      });

      const {swString, warnings} = await generateSWString(options);
      expect(warnings).to.be.empty;

      await validateServiceWorkerRuntime({swString, expectedMethodCalls: {
        [handler]: [[]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precacheAndRoute: [[[], {}]],
        navigationPreloadEnable: [[]],
        registerRoute: [[urlPattern, {name: handler}, 'GET']],
      }});
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

        const {warnings} = await generateSWString(options);
        expect(warnings).to.have.length(1);
      });
    }

    it(`should warn when a strategy function (lowercase) name is used`, async function() {
      const runtimeCaching = [{
        urlPattern: /abc/,
        handler: 'cacheFirst',
      }];
      const options = Object.assign({}, BASE_OPTIONS, {runtimeCaching});

      const {warnings} = await generateSWString(options);
      expect(warnings).to.have.length(1);
    });
  });
});

const expect = require('chai').expect;
const fse = require('fs-extra');
const os = require('os');
const path = require('path');
const tempy = require('tempy');

const errors = require('../../../../packages/workbox-build/src/lib/errors');
const generateSWNoFS = require('../../../../packages/workbox-build/src/entry-points/generate-sw-no-fs');
const validateServiceWorkerRuntime = require('../../../../infra/utils/validator/service-worker-runtime');

describe(`entry-points/generate-sw-no-fs.js (End to End)`, function() {
  const pathToSWTemplate = path.join(__dirname, '..', '..', '..', '..', 'packages', 'workbox-build', 'src', 'templates', 'sw.js.tmpl');
  const GLOB_DIR = path.join(__dirname, '..', '..', 'static', 'example-project-1');
  const SW_TEMPLATE = fse.readFileSync(pathToSWTemplate, 'utf8');
  const DEFAULT_IMPORT_SCRIPTS = ['workbox.js'];
  const BASE_OPTIONS = {
    importScripts: DEFAULT_IMPORT_SCRIPTS,
    swTemplate: SW_TEMPLATE,
  };
  const REQUIRED_PARAMS = [
    'swTemplate',
  ];
  const SUPPORTED_PARAMS = [
    'cacheId',
    'clientsClaim',
    'directoryIndex',
    'dontCacheBustUrlsMatching',
    'globDirectory',
    'globIgnores',
    'globPatterns',
    'handleFetch',
    'ignoreUrlParametersMatching',
    'importScripts',
    'importWorkboxFromCDN',
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
    'injectionPointRegexp',
    'swDest',
    'swSrc',
  ];

  describe('required parameters', function() {
    for (const requiredParam of REQUIRED_PARAMS) {
      it(`should reject with a ValidationError when '${requiredParam}' is missing`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        delete options[requiredParam];

        try {
          await generateSWNoFS(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(requiredParam);
        }
      });
    }
  });

  describe('unsupported parameters', function() {
    for (const unsupportedParam of UNSUPPORTED_PARAMS) {
      it(`should reject with a ValidationError when '${unsupportedParam}' is present`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        options[unsupportedParam] = unsupportedParam;

        try {
          await generateSWNoFS(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(unsupportedParam);
        }
      });
    }
  });

  describe('invalid parameter values', function() {
    for (const param of SUPPORTED_PARAMS) {
      it(`should reject with a ValidationError when '${param}' is null`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        options[param] = null;

        try {
          await generateSWNoFS(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(param);
        }
      });
    }
  });

  describe(`should handle various runtime errors`, function() {
    it(`should throw the expected error when 'swTemplate' contains unknown variables`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        swTemplate: 'INVALID <%= variable %>',
      });

      try {
        await generateSWNoFS(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.message).to.have.string(errors['populating-sw-tmpl-failed']);
      }
    });
  });

  describe(`should return a string with the expected service worker code when properly configured`, function() {
    it(`should use defaults when all the required parameters are present`, async function() {
      const options = Object.assign({}, BASE_OPTIONS);

      const swCode = await generateSWNoFS(options);
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precache: [[[]]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional code via importScripts`, async function() {
      const importScripts = DEFAULT_IMPORT_SCRIPTS.concat('manifest.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
      });

      let swCode = await generateSWNoFS(options);

      // Rather than emulate importScripts() logic in the validator, we're just
      // going to inject some additional code at the start of the generated
      // service worker, and pretend that it's the code in 'manifest.js'.
      const additionalManifestEntries = [{
        url: '/test',
        revision: 'test',
      }];
      swCode = `self.__precacheManifest = ${JSON.stringify(additionalManifestEntries)};${swCode}`;
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[...importScripts]],
        precache: [[additionalManifestEntries]],
      }});
    });

    it(`should use defaults when all the required parameters are present, using local files and additional code via importScripts`, async function() {
      const importScripts = DEFAULT_IMPORT_SCRIPTS.concat('manifest.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        globDirectory: path.join(__dirname, '..', '..', 'static', 'example-project-1'),
      });

      let swCode = await generateSWNoFS(options);

      // Rather than emulate importScripts() logic in the validator, we're just
      // going to inject some additional code at the start of the generated
      // service worker, and pretend that it's the code in 'manifest.js'.
      const additionalManifestEntries = [{
        url: '/test',
        revision: 'test',
      }];
      swCode = `self.__precacheManifest = ${JSON.stringify(additionalManifestEntries)};${swCode}`;
      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [[...importScripts]],
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
        }].concat(additionalManifestEntries)]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with additional WorkboxSW() configuration`, async function() {
      const additionalOptions = {
        cacheId: 'test',
        clientsClaim: true,
        directoryIndex: 'test.html',
        handleFetch: false,
        ignoreUrlParametersMatching: [/test1/, /test2/],
        skipWaiting: true,
      };
      const options = Object.assign({}, BASE_OPTIONS, additionalOptions);

      const swCode = await generateSWNoFS(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        constructor: [[additionalOptions]],
        importScripts: [[...DEFAULT_IMPORT_SCRIPTS]],
        precache: [[[]]],
      }});
    });

    it(`should use defaults when all the required parameters are present, with 'importWorkboxFromCDN' instead of 'importScripts'`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts: undefined,
        importWorkboxFromCDN: true,
      });

      const swCode = await generateSWNoFS(options);

      await validateServiceWorkerRuntime({swCode, expectedMethodCalls: {
        constructor: [[{}]],
        importScripts: [],
        precache: [[[]]],
      }});
    });
  });
});

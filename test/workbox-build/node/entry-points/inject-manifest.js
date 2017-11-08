const expect = require('chai').expect;
const path = require('path');
const tempy = require('tempy');

const errors = require('../../../../packages/workbox-build/src/lib/errors');
const injectManifest = require('../../../../packages/workbox-build/src/entry-points/inject-manifest');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');

describe(`[workbox-build] entry-points/inject-manifest.js (End to End)`, function() {
  const GLOB_DIR = path.join(__dirname, '..', '..', 'static', 'example-project-1');
  const SW_SRC_DIR = path.join(__dirname, '..', '..', 'static', 'sw-injections');
  const BASE_OPTIONS = {
    globDirectory: GLOB_DIR,
    swDest: tempy.file(),
    swSrc: path.join(SW_SRC_DIR, 'basic.js'),
  };
  const REQUIRED_PARAMS = [
    'globDirectory',
    'swDest',
    'swSrc',
  ];
  const SUPPORTED_PARAMS = [
    'dontCacheBustUrlsMatching',
    'globIgnores',
    'globPatterns',
    'injectionPointRegexp',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyUrlPrefix',
    'templatedUrls',
  ].concat(REQUIRED_PARAMS);
  const UNSUPPORTED_PARAMS = [
    'cacheId',
    'clientsClaim',
    'directoryIndex',
    'ignoreUrlParametersMatching',
    'importScripts',
    'importWorkboxFromCDN',
    'navigateFallback',
    'navigateFallbackWhitelist',
    'runtimeCaching',
    'skipWaiting',
  ];

  describe('[workbox-build] required parameters', function() {
    for (const requiredParam of REQUIRED_PARAMS) {
      it(`should reject with a ValidationError when '${requiredParam}' is missing`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        delete options[requiredParam];

        try {
          await injectManifest(options);
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
          await injectManifest(options);
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
          await injectManifest(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(param);
        }
      });
    }
  });

  describe(`[workbox-build] runtime errors`, function() {
    it(`should throw the expected error when 'swSrc' is invalid`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: 'DOES_NOT_EXIST',
      });

      try {
        await injectManifest(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.message).to.have.string(errors['invalid-sw-src']);
      }
    });

    it(`should throw the expected error when 'swSrc' and 'swDest' are the same path`, async function() {
      const path = 'same';
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: path,
        swDest: path,
      });

      try {
        await injectManifest(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.message).to.have.string(errors['same-src-and-dest']);
      }
    });

    it(`should throw the expected error when there is no match for 'injectionPointRegexp'`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: path.join(SW_SRC_DIR, 'bad-no-injection.js'),
      });

      try {
        await injectManifest(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.message).to.have.string(errors['injection-point-not-found']);
      }
    });

    it(`should throw the expected error when there are multiple matches for 'injectionPointRegexp'`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: path.join(SW_SRC_DIR, 'bad-multiple-injection.js'),
      });

      try {
        await injectManifest(options);
        throw new Error('Unexpected success.');
      } catch (error) {
        expect(error.message).to.have.string(errors['multiple-injection-points']);
      }
    });
  });

  describe(`[workbox-build] writing a service worker file`, function() {
    it(`should use defaults when all the required parameters are present`, async function() {
      const swDest = tempy.file();
      const options = Object.assign({}, BASE_OPTIONS, {swDest});

      const {count, size} = await injectManifest(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
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
        }]]],
      }});
    });

    it(`should use defaults when all the required parameters are present, when workboxSW.precache() is called twice`, async function() {
      const swDest = tempy.file();
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        swSrc: path.join(SW_SRC_DIR, 'multiple-calls.js'),
      });

      const {count, size} = await injectManifest(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
        importScripts: [['./sample-import.js']],
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
        }]], [[
          '/extra-assets/example.1234.css',
          '/extra-assets/example-2.1234.js',
        ]]],
      }});
    });

    it(`should use defaults when all the required parameters are present, when a custom 'injectionPointRegexp' is used`, async function() {
      const swDest = tempy.file();
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        injectionPointRegexp: /(\.precacheAndRoute\()\/\* manifestEntries \*\/(\))/,
        swSrc: path.join(SW_SRC_DIR, 'custom-injection-point.js'),
      });

      const {count, size} = await injectManifest(options);

      expect(count).to.eql(6);
      expect(size).to.eql(2421);
      await validateServiceWorkerRuntime({swFile: swDest, expectedMethodCalls: {
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
        }]]],
      }});
    });
  });
});

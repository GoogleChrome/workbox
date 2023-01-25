/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fse = require('fs-extra');
const upath = require('upath');
const tempy = require('tempy');

const {errors} = require('../../../packages/workbox-build/build/lib/errors');
const {
  injectManifest,
} = require('../../../packages/workbox-build/build/inject-manifest');
const {
  WorkboxConfigError,
} = require('../../../packages/workbox-build/build/lib/validate-options');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');

chai.use(chaiAsPromised);
const {expect} = chai;

describe(`[workbox-build] inject-manifest.js (End to End)`, function () {
  const GLOB_DIR = upath.join(__dirname, '..', 'static', 'example-project-1');
  const SW_SRC_DIR = upath.join(__dirname, '..', 'static', 'sw-injections');
  const BASE_OPTIONS = {
    globDirectory: GLOB_DIR,
    swDest: tempy.file({extension: 'js'}),
    swSrc: upath.join(SW_SRC_DIR, 'basic.js'),
  };
  const REQUIRED_PARAMS = ['swDest', 'swSrc'];
  const SUPPORTED_PARAMS = [
    'additionalManifestEntries',
    'dontCacheBustURLsMatching',
    'globDirectory',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
    'injectionPoint',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyURLPrefix',
    'templatedURLs',
  ].concat(REQUIRED_PARAMS);
  const UNSUPPORTED_PARAMS = [
    'cacheId',
    'clientsClaim',
    'directoryIndex',
    'ignoreURLParametersMatching',
    'importScripts',
    'importWorkboxFrom',
    'mode',
    'navigateFallback',
    'navigateFallbackAllowlist',
    'runtimeCaching',
    'skipWaiting',
  ];

  describe('[workbox-build] required parameters', function () {
    for (const requiredParam of REQUIRED_PARAMS) {
      it(`should reject when '${requiredParam}' is missing`, async function () {
        const options = Object.assign({}, BASE_OPTIONS);
        delete options[requiredParam];

        await expect(injectManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          requiredParam,
        );
      });
    }
  });

  describe('[workbox-build] unsupported parameters', function () {
    for (const unsupportedParam of UNSUPPORTED_PARAMS) {
      it(`should reject when '${unsupportedParam}' is present`, async function () {
        const options = Object.assign({}, BASE_OPTIONS);
        options[unsupportedParam] = unsupportedParam;

        await expect(injectManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          unsupportedParam,
        );
      });
    }
  });

  describe('[workbox-build] invalid parameter values', function () {
    for (const param of SUPPORTED_PARAMS) {
      it(`should reject when '${param}' is null`, async function () {
        const options = Object.assign({}, BASE_OPTIONS);
        options[param] = null;

        await expect(injectManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          param,
        );
      });
    }
  });

  describe(`[workbox-build] runtime errors`, function () {
    it(`should throw the expected error when 'swSrc' is invalid`, async function () {
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: 'DOES_NOT_EXIST',
      });

      await expect(injectManifest(options)).to.eventually.be.rejectedWith(
        errors['invalid-sw-src'],
      );
    });

    it(`should throw the expected error when there is no match for 'injectionPoint'`, async function () {
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: upath.join(SW_SRC_DIR, 'bad-no-injection.js'),
      });

      await expect(injectManifest(options)).to.eventually.be.rejectedWith(
        errors['injection-point-not-found'],
      );
    });

    it(`should throw the expected error when there is no match for 'injectionPoint' and 'swSrc' and 'swDest' are the same`, async function () {
      const swFile = upath.join(SW_SRC_DIR, 'bad-no-injection.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: swFile,
        swDest: swFile,
      });

      await expect(injectManifest(options)).to.eventually.be.rejectedWith(
        errors['same-src-and-dest'],
      );
    });

    it(`should throw the expected error when there are multiple matches for 'injectionPoint'`, async function () {
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc: upath.join(SW_SRC_DIR, 'bad-multiple-injection.js'),
      });

      await expect(injectManifest(options)).to.eventually.be.rejectedWith(
        errors['multiple-injection-points'],
      );
    });
  });

  describe(`[workbox-build] writing a service worker file`, function () {
    it(`should use defaults when all the required parameters are present`, async function () {
      const swDest = tempy.file({extension: 'js'});
      const options = Object.assign({}, BASE_OPTIONS, {swDest});

      const {count, filePaths, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
      expect(filePaths).to.have.members([upath.resolve(swDest)]);

      await validateServiceWorkerRuntime({
        entryPoint: 'injectManifest',
        swFile: swDest,
        expectedMethodCalls: {
          precacheAndRoute: [
            [
              [
                {
                  url: 'index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
            ],
          ],
        },
      });
    });

    it(`should use absolute paths in the filePaths return value`, async function () {
      // Deliberately use a relative path for swDest.
      const swDest = upath.relative('.', tempy.file({extension: 'js'}));
      const options = Object.assign({}, BASE_OPTIONS, {swDest});

      const {filePaths, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      // Use upath.resolve() to confirm that we get back an absolute path.
      expect(filePaths).to.have.members([upath.resolve(swDest)]);
    });

    it(`should use defaults when all the required parameters are present, when workboxSW.precache() is called twice`, async function () {
      const swDest = tempy.file({extension: 'js'});
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        swSrc: upath.join(SW_SRC_DIR, 'multiple-calls.js'),
      });

      const {count, filePaths, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
      expect(filePaths).to.have.members([upath.resolve(swDest)]);

      await validateServiceWorkerRuntime({
        entryPoint: 'injectManifest',
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [['./sample-import.js']],
          precacheAndRoute: [
            [
              [
                {
                  url: 'index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
            ],
            [
              [
                '/extra-assets/example.1234.css',
                '/extra-assets/example-2.1234.js',
              ],
            ],
          ],
        },
      });
    });

    it(`should use defaults when all the required parameters are present, when a custom 'injectionPoint' is used`, async function () {
      const swDest = tempy.file({extension: 'js'});
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        injectionPoint: 'self.__custom_injection_point',
        swSrc: upath.join(SW_SRC_DIR, 'custom-injection-point.js'),
      });

      const {count, filePaths, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
      expect(filePaths).to.have.members([upath.resolve(swDest)]);

      await validateServiceWorkerRuntime({
        entryPoint: 'injectManifest',
        swFile: swDest,
        expectedMethodCalls: {
          precacheAndRoute: [
            [
              [
                {
                  url: 'index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
            ],
          ],
        },
      });
    });

    it(`should support using the default 'injectionPoint' when precacheAndRoute() is called with options`, async function () {
      const swDest = tempy.file({extension: 'js'});
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        swSrc: upath.join(SW_SRC_DIR, 'precache-and-route-options.js'),
      });

      const {count, filePaths, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
      expect(filePaths).to.have.members([upath.resolve(swDest)]);

      await validateServiceWorkerRuntime({
        entryPoint: 'injectManifest',
        swFile: swDest,
        expectedMethodCalls: {
          precacheAndRoute: [
            [
              [
                {
                  url: 'index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
              {
                cleanURLs: true,
              },
            ],
          ],
        },
      });
    });

    it(`should ignore swSrc and swDest when generating manifest entries`, async function () {
      const tempDirectory = tempy.directory();
      await fse.copy(BASE_OPTIONS.globDirectory, tempDirectory);
      const swSrc = upath.join(tempDirectory, 'sw-src-service-worker.js');
      await fse.copyFile(upath.join(SW_SRC_DIR, 'basic.js'), swSrc);
      const swDest = upath.join(tempDirectory, 'sw-dest-service-worker.js');
      await fse.createFile(swDest);
      const options = Object.assign({}, BASE_OPTIONS, {
        swSrc,
        swDest,
        globDirectory: tempDirectory,
      });

      const {count, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
      await validateServiceWorkerRuntime({
        entryPoint: 'injectManifest',
        swFile: swDest,
        expectedMethodCalls: {
          precacheAndRoute: [
            [
              [
                {
                  url: 'index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
            ],
          ],
        },
      });
    });
  });

  describe(`[workbox-webpack-plugin] Sourcemap manipulation`, function () {
    it(`should update the sourcemap to account for manifest injection`, async function () {
      const outputDir = tempy.directory();
      const swSrc = upath.join(SW_SRC_DIR, 'basic-with-sourcemap.js.nolint');
      const swDest = upath.join(outputDir, 'basic-with-sourcemap.js');
      const sourcemapDest = upath.join(
        outputDir,
        'basic-with-sourcemap.js.map',
      );
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        swSrc,
      });

      const {count, filePaths, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
      expect(filePaths).to.have.members([upath.resolve(swDest), sourcemapDest]);

      const actualSourcemap = await fse.readJSON(sourcemapDest);
      const expectedSourcemap = await fse.readJSON(
        upath.join(SW_SRC_DIR, '..', 'expected-source-map.js.map'),
      );
      expect(actualSourcemap).to.eql(expectedSourcemap);

      // We can't validate the SW file contents.
    });

    it(`should not update the sourcemap if it uses a data: URL`, async function () {
      const outputDir = tempy.directory();
      const swSrc = upath.join(
        SW_SRC_DIR,
        'basic-with-sourcemap-data-url.js.nolint',
      );
      const swDest = upath.join(outputDir, 'basic-with-sourcemap.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        swSrc,
      });

      const {count, size, warnings} = await injectManifest(options);
      expect(warnings).to.be.empty;
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);

      // We can't validate the SW file contents.
    });

    it(`should perform injection, but report a warning if the sourcemap file can't be found`, async function () {
      const outputDir = tempy.directory();
      const swSrc = upath.join(
        SW_SRC_DIR,
        'basic-with-invalid-sourcemap.js.nolint',
      );
      const swDest = upath.join(outputDir, 'basic-with-sourcemap.js');
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        swSrc,
      });

      const {count, size, warnings} = await injectManifest(options);
      expect(warnings.length).to.eql(1);
      expect(warnings[0]).to.include(errors['cant-find-sourcemap']);
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);

      // We can't validate the SW file contents.
    });
  });

  describe(`[workbox-build] removed options`, function () {
    // These were deprecated in v4, and formally removed in v5.
    const oldOptionsToValue = {
      dontCacheBustUrlsMatching: /ignored/,
      ignoreUrlParametersMatching: [/ignored/],
      modifyUrlPrefix: {
        ignored: 'ignored',
      },
      templatedUrls: {},
    };

    for (const [option, value] of Object.entries(oldOptionsToValue)) {
      it(`should fail validation when ${option} is used`, async function () {
        const options = Object.assign({}, BASE_OPTIONS, {
          [option]: value,
        });

        await expect(injectManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          option,
        );
      });
    }
  });
});

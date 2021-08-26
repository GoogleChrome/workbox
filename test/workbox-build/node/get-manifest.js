/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiMatchPattern = require('chai-match-pattern');
const fse = require('fs-extra');
const upath = require('upath');
const tempy = require('tempy');

chai.use(chaiAsPromised);
chai.use(chaiMatchPattern);
const {expect} = chai;

const {
  getManifest,
} = require('../../../packages/workbox-build/build/get-manifest');
const {
  WorkboxConfigError,
} = require('../../../packages/workbox-build/build/lib/validate-options');

describe(`[workbox-build] get-manifest.js (End to End)`, function () {
  const SRC_DIR = upath.join(__dirname, '..', 'static', 'example-project-1');
  const BASE_OPTIONS = {
    globDirectory: SRC_DIR,
  };
  const SUPPORTED_PARAMS = [
    'dontCacheBustURLsMatching',
    'globDirectory',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyURLPrefix',
    'templatedURLs',
  ];
  const UNSUPPORTED_PARAMS = [
    'cacheId',
    'clientsClaim',
    'directoryIndex',
    'ignoreURLParametersMatching',
    'importScripts',
    'importWorkboxFrom',
    'injectionPointRegexp',
    'mode',
    'navigateFallback',
    'navigateFallbackAllowlist',
    'runtimeCaching',
    'skipWaiting',
    'swSrc',
    'swDest',
  ];

  describe('[workbox-build] unsupported parameters', function () {
    for (const unsupportedParam of UNSUPPORTED_PARAMS) {
      it(`should fail validation when '${unsupportedParam}' is present`, async function () {
        const options = Object.assign({}, BASE_OPTIONS);
        options[unsupportedParam] = unsupportedParam;

        await expect(getManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          unsupportedParam,
        );
      });
    }
  });

  describe('[workbox-build] invalid parameter values', function () {
    for (const param of SUPPORTED_PARAMS) {
      it(`should fail validation when '${param}' is an unexpected value`, async function () {
        const options = Object.assign({}, BASE_OPTIONS);
        options[param] = () => {};

        await expect(getManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          param,
        );
      });
    }
  });

  describe('[workbox-build] should generate a valid manifest when properly configured', function () {
    it(`should use defaults when all the required parameters are present`, async function () {
      const options = Object.assign({}, BASE_OPTIONS);

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
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
      ]);
      expect(count).to.eql(6);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698]);
    });

    it(`should use defaults when all the required parameters, and 'globPatterns' are present`, async function () {
      const options = Object.assign({}, BASE_OPTIONS, {
        globPatterns: ['**/*.html', '**/*.js'],
      });

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
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
          url: 'webpackEntry.js',
          revision: /^[0-9a-f]{32}$/,
        },
      ]);
      expect(count).to.eql(4);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2707, 2629]);
    });

    it(`should use defaults when all the required parameters, and 'globIgnores' are present`, async function () {
      const options = Object.assign(
        {
          globIgnores: ['**/*.html', '**/*.js'],
        },
        BASE_OPTIONS,
      );

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
        {
          url: 'styles/stylesheet-1.css',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: 'styles/stylesheet-2.css',
          revision: /^[0-9a-f]{32}$/,
        },
      ]);
      expect(count).to.eql(2);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([69, 75]);
    });

    it(`should use defaults when all the required parameters, 'globIgnores', and 'globPatterns' are present`, async function () {
      const options = Object.assign({}, BASE_OPTIONS, {
        globPatterns: ['**/*.css', '**/*.js'],
        globIgnores: ['node_modules/**/*', '**/*2*'],
      });

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
        {
          url: 'styles/stylesheet-1.css',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: 'webpackEntry.js',
          revision: /^[0-9a-f]{32}$/,
        },
      ]);
      expect(count).to.eql(2);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([216, 219]);
    });

    it(`should use defaults when all the required parameters, and 'maximumFileSizeToCacheInBytes' are present`, async function () {
      const options = Object.assign(
        {
          maximumFileSizeToCacheInBytes: 50,
        },
        BASE_OPTIONS,
      );

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.have.lengthOf(2);
      expect(manifestEntries).to.matchPattern([
        {
          revision: /^[0-9a-f]{32}$/,
          url: 'page-1.html',
        },
        {
          revision: /^[0-9a-f]{32}$/,
          url: 'page-2.html',
        },
        {
          revision: /^[0-9a-f]{32}$/,
          url: 'styles/stylesheet-1.css',
        },
        {
          revision: /^[0-9a-f]{32}$/,
          url: 'styles/stylesheet-2.css',
        },
      ]);
      expect(count).to.eql(4);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([101, 109]);
    });

    it(`should use defaults when all the required parameters, and 'templatedURLs' are present`, async function () {
      const url1 = 'url1';
      const url2 = 'url2';

      const options = Object.assign(
        {
          templatedURLs: {
            [url1]: ['**/*.html'],
            [url2]: 'string dependency',
          },
        },
        BASE_OPTIONS,
      );

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
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
        {
          url: 'url1',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: 'url2',
          revision: /^[0-9a-f]{32}$/,
        },
      ]);
      expect(count).to.eql(8);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([5162, 5324]);
    });

    it(`should use defaults when all the required parameters, and 'manifestTransforms' are present`, async function () {
      // This filters out all entries unless the url property includes the string '1'.
      const transform1 = (entries) => {
        const manifest = entries.filter((entry) => {
          return entry.url.includes('1');
        });
        return {manifest};
      };
      // This modifies all entries to prefix the url property with the string '/prefix/'.
      const transform2 = (entries) => {
        const manifest = entries.filter((entry) => {
          entry.url = `/prefix/${entry.url}`;
          return entry;
        });
        return {manifest};
      };

      const options = Object.assign(
        {
          manifestTransforms: [transform1, transform2],
        },
        BASE_OPTIONS,
      );

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
        {
          url: '/prefix/page-1.html',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: '/prefix/styles/stylesheet-1.css',
          revision: /^[0-9a-f]{32}$/,
        },
      ]);
      expect(count).to.eql(2);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([50, 54]);
    });

    it(`should use defaults when all the required parameters are present, with 'globFollow' and symlinks`, async function () {
      const globDirectory = tempy.directory();

      await fse.ensureSymlink(SRC_DIR, upath.join(globDirectory, 'link'));

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        globFollow: false,
      });

      const {count, size, manifestEntries, warnings} = await getManifest(
        options,
      );
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.matchPattern([
        {
          url: 'link/index.html',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: 'link/page-1.html',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: 'link/page-2.html',
          revision: /^[0-9a-f]{32}$/,
        },
        {
          url: 'link/webpackEntry.js',
          revision: /^[0-9a-f]{32}$/,
        },
      ]);
      expect(count).to.eql(4);
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2707, 2629]);
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

        await expect(getManifest(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          option,
        );
      });
    }
  });
});

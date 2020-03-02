/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const fse = require('fs-extra');
const upath = require('upath');
const tempy = require('tempy');

const getManifest = require('../../../packages/workbox-build/src/get-manifest');

describe(`[workbox-build] get-manifest.js (End to End)`, function() {
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
    'navigateFallback',
    'navigateFallbackAllowlist',
    'runtimeCaching',
    'skipWaiting',
    'swSrc',
    'swDest',
  ];

  describe('[workbox-build] unsupported parameters', function() {
    for (const unsupportedParam of UNSUPPORTED_PARAMS) {
      it(`should reject with a ValidationError when '${unsupportedParam}' is present`, async function() {
        const options = Object.assign({}, BASE_OPTIONS);
        options[unsupportedParam] = unsupportedParam;

        try {
          await getManifest(options);
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
          await getManifest(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(param);
        }
      });
    }
  });

  describe('[workbox-build] should generate a valid manifest when properly configured', function() {
    it(`should use defaults when all the required parameters are present`, async function() {
      const options = Object.assign({}, BASE_OPTIONS);

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: 'index.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'page-1.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'page-2.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'styles/stylesheet-1.css',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'styles/stylesheet-2.css',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'webpackEntry.js',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(6);
      expect(size).to.eql(2604);
    });

    it(`should use defaults when all the required parameters, and 'globPatterns' are present`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        globPatterns: ['**/*.html', '**/*.js'],
      });

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: 'index.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'page-1.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'page-2.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'webpackEntry.js',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(4);
      expect(size).to.eql(2535);
    });

    it(`should use defaults when all the required parameters, and 'globIgnores' are present`, async function() {
      const options = Object.assign({
        globIgnores: ['**/*.html', '**/*.js'],
      }, BASE_OPTIONS);

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: 'styles/stylesheet-1.css',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'styles/stylesheet-2.css',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(2);
      expect(size).to.eql(69);
    });

    it(`should use defaults when all the required parameters, 'globIgnores', and 'globPatterns' are present`, async function() {
      const options = Object.assign({}, BASE_OPTIONS, {
        globPatterns: ['**/*.css', '**/*.js'],
        globIgnores: ['node_modules/**/*', '**/*2*'],
      });

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: 'styles/stylesheet-1.css',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'webpackEntry.js',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(2);
      expect(size).to.eql(217);
    });

    it(`should use defaults when all the required parameters, and 'maximumFileSizeToCacheInBytes' are present`, async function() {
      const options = Object.assign({
        maximumFileSizeToCacheInBytes: 50,
      }, BASE_OPTIONS);

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.have.lengthOf(2);
      expect(manifestEntries).to.deep.equal([{
        revision: '32_CHARACTER_HASH',
        url: 'page-1.html',
      }, {
        revision: '32_CHARACTER_HASH',
        url: 'page-2.html',
      }, {
        revision: '32_CHARACTER_HASH',
        url: 'styles/stylesheet-1.css',
      }, {
        revision: '32_CHARACTER_HASH',
        url: 'styles/stylesheet-2.css',
      }]);
      expect(count).to.eql(4);
      expect(size).to.eql(101);
    });

    it(`should use defaults when all the required parameters, and 'templatedURLs' are present`, async function() {
      const url1 = 'url1';
      const url2 = 'url2';

      const options = Object.assign({
        templatedURLs: {
          [url1]: ['**/*.html'],
          [url2]: 'string dependency',
        },
      }, BASE_OPTIONS);

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: 'index.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'page-1.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'page-2.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'styles/stylesheet-1.css',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'styles/stylesheet-2.css',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'webpackEntry.js',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'url1',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'url2',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(8);
      expect(size).to.eql(4973);
    });

    it(`should use defaults when all the required parameters, and 'manifestTransforms' are present`, async function() {
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

      const options = Object.assign({
        manifestTransforms: [transform1, transform2],
      }, BASE_OPTIONS);

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: '/prefix/page-1.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: '/prefix/styles/stylesheet-1.css',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(2);
      expect(size).to.eql(50);
    });

    it(`should use defaults when all the required parameters are present, with 'globFollow' and symlinks`, async function() {
      const globDirectory = tempy.directory();

      await fse.ensureSymlink(SRC_DIR, upath.join(globDirectory, 'link'));

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        globFollow: false,
      });

      const {count, size, manifestEntries, warnings} = await getManifest(options);
      expect(warnings).to.be.empty;
      expect(manifestEntries).to.deep.equal([{
        url: 'link/index.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'link/page-1.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'link/page-2.html',
        revision: '32_CHARACTER_HASH',
      }, {
        url: 'link/webpackEntry.js',
        revision: '32_CHARACTER_HASH',
      }]);
      expect(count).to.eql(4);
      expect(size).to.eql(2535);
    });
  });

  describe(`[workbox-build] removed options`, function() {
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
      it(`should fail validation when ${option} is used`, async function() {
        const options = Object.assign({}, BASE_OPTIONS, {
          [option]: value,
        });

        try {
          await getManifest(options);
          throw new Error('Unexpected success.');
        } catch (error) {
          expect(error.name).to.eql('ValidationError');
          expect(error.details[0].context.key).to.eql(option);
        }
      });
    }
  });
});

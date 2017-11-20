const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fse = require('fs-extra');
const path = require('path');
const tempy = require('tempy');
const vm = require('vm');
const webpack = require('webpack');

const WorkboxWebpackPlugin = require('../../../packages/workbox-webpack-plugin/src/index');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');
const compareManifestEntries = require('../../../infra/testing/validator/compare-manifest-entries');

describe(`[workbox-webpack-plugin] index.js (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const WORKBOX_SW_FILE_NAME = 'workbox-sw.js';
  const SRC_DIR = path.join(__dirname, '..', 'static', 'example-project-1');

  describe(`[workbox-webpack-plugin] multiple chunks`, function() {
    const FILE_MANIFEST_NAME = 'file-manifest.bb510304f76a8d436905.js';

    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new WorkboxWebpackPlugin(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, 'sw.js');
        try {
          // First, validate that the generated sw.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              WORKBOX_SW_FILE_NAME,
              FILE_MANIFEST_NAME,
            ]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          // Unfortunately, the order of entries in the generated manifest isn't
          // stable, so we can't just use chai's .eql()
          const expectedEntries = [{
            revision: 'bb510304f76a8d436905',
            url: 'workbox-sw.js',
          }, {
            revision: 'bb510304f76a8d436905',
            url: 'workbox-sw.js.map',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }, {
            url: 'entry2-17c2a1b5c94290899539.js',
          }];

          compareManifestEntries(expectedEntries, context.self.__precacheManifest);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] html-webpack-plugin and a single chunk`, function() {
    const FILE_MANIFEST_NAME = 'file-manifest.5de7050ae3d21a3ada12.js';

    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new WorkboxWebpackPlugin(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, 'sw.js');
        try {
          // First, validate that the generated sw.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              WORKBOX_SW_FILE_NAME,
              FILE_MANIFEST_NAME,
            ]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          // Unfortunately, the order of entries in the generated manifest isn't
          // stable, so we can't just use chai's .eql()
          const expectedEntries = [{
            revision: '5de7050ae3d21a3ada12',
            url: 'workbox-sw.js',
          }, {
            revision: '5de7050ae3d21a3ada12',
            url: 'workbox-sw.js.map',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }, {
            url: 'entry2-17c2a1b5c94290899539.js',
          }, {
            revision: '5de7050ae3d21a3ada12',
            url: 'index.html',
          }];

          compareManifestEntries(expectedEntries, context.self.__precacheManifest);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] copy-webpack-plugin and a single chunk`, function() {
    const FILE_MANIFEST_NAME = 'file-manifest.d9b9be4d03e6c18744d9.js';

    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        plugins: [
          new CopyWebpackPlugin([{
            from: SRC_DIR,
            to: outputDir,
          }]),
          new WorkboxWebpackPlugin(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, 'sw.js');
        try {
          // First, validate that the generated sw.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              WORKBOX_SW_FILE_NAME,
              FILE_MANIFEST_NAME,
            ]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          // Unfortunately, the order of entries in the generated manifest isn't
          // stable, so we can't just use chai's .eql()
          const expectedEntries = [{
            url: 'workbox-sw.js',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'workbox-sw.js.map',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'webpackEntry.js',
            revision: '8e8e9f093f036bd18dfa',
          }, {
            url: 'images/example-jpeg.jpg',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'index.html',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'images/web-fundamentals-icon192x192.png',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'page-1.html',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'page-2.html',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'styles/stylesheet-1.css',
            revision: 'd9b9be4d03e6c18744d9',
          }, {
            url: 'styles/stylesheet-2.css',
            revision: 'd9b9be4d03e6c18744d9',
          }];

          compareManifestEntries(expectedEntries, context.self.__precacheManifest);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

const CopyWebpackPlugin = require('copy-webpack-plugin');
const GenerateAssetPlugin = require('generate-asset-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const expect = require('chai').expect;
const fse = require('fs-extra');
const glob = require('glob');
const path = require('path');
const tempy = require('tempy');
const vm = require('vm');
const webpack = require('webpack');

const {InjectManifest} = require('../../../packages/workbox-webpack-plugin/src/index');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');
const {getModuleUrl} = require('../../../packages/workbox-build/src/lib/cdn-utils');

describe(`[workbox-webpack-plugin] InjectManifest (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const WORKBOX_SW_FILE_NAME = getModuleUrl('workbox-sw');
  const SRC_DIR = path.join(__dirname, '..', 'static', 'example-project-1');
  const SW_SRC = path.join(__dirname, '..', 'static', 'sw-src.js');
  const WORKBOX_DIRECTORY_PREFIX = 'workbox-';
  const ALL_WORKBOX_FILES = [
    'workbox-background-sync.dev.js',
    'workbox-background-sync.dev.js.map',
    'workbox-background-sync.prod.js',
    'workbox-background-sync.prod.js.map',
    'workbox-broadcast-cache-update.dev.js',
    'workbox-broadcast-cache-update.dev.js.map',
    'workbox-broadcast-cache-update.prod.js',
    'workbox-broadcast-cache-update.prod.js.map',
    'workbox-cache-expiration.dev.js',
    'workbox-cache-expiration.dev.js.map',
    'workbox-cache-expiration.prod.js',
    'workbox-cache-expiration.prod.js.map',
    'workbox-cacheable-response.dev.js',
    'workbox-cacheable-response.dev.js.map',
    'workbox-cacheable-response.prod.js',
    'workbox-cacheable-response.prod.js.map',
    'workbox-core.dev.js',
    'workbox-core.dev.js.map',
    'workbox-core.prod.js',
    'workbox-core.prod.js.map',
    'workbox-google-analytics.dev.js',
    'workbox-google-analytics.dev.js.map',
    'workbox-google-analytics.prod.js',
    'workbox-google-analytics.prod.js.map',
    'workbox-precaching.dev.js',
    'workbox-precaching.dev.js.map',
    'workbox-precaching.prod.js',
    'workbox-precaching.prod.js.map',
    'workbox-routing.dev.js',
    'workbox-routing.dev.js.map',
    'workbox-routing.prod.js',
    'workbox-routing.prod.js.map',
    'workbox-strategies.dev.js',
    'workbox-strategies.dev.js.map',
    'workbox-strategies.prod.js',
    'workbox-strategies.prod.js.map',
    'workbox-sw.js',
    'workbox-sw.js.map',
  ];

  describe(`[workbox-webpack-plugin] runtime errors`, function() {
    it(`should throw when swSrc is not set`, function() {
      expect(() => new InjectManifest()).to.throw().with.property('name', 'AssertionError [ERR_ASSERTION]');
    });

    it(`should throw when importWorkboxFrom is set to an invalid chunk name`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            importWorkboxFrom: 'INVALID',
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run((webpackError) => {
        if (webpackError) {
          if (webpackError.message.includes('importWorkboxFrom')) {
            done();
          } else {
            done(new Error(`An unexpected error was thrown: ${webpackError.message}`));
          }
        } else {
          done(new Error('Unexpected success.'));
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Ensure only one precache-manifest is present on re-compile`, function() {
    it(`should only have one reference to precache-manifest file in 'importScripts'`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.b6f6b1b151c4f027ee1e1aa3061eeaf7.js';
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
          new InjectManifest({
            swSrc: SW_SRC,
          }),
        ],
      };
      let emitCount = 0;

      const compiler = webpack(config);
      const watching = compiler.watch({
      }, async (err, stats) => {
        emitCount += 1;

        if (err) {
          done(err);
          return;
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));

        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry2-17c2a1b5c94290899539.js',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          if (emitCount == 2) {
            watching.close(done);
          } else {
            watching.invalidate(); // triggers second compilation
          }
        } catch (error) {
          watching.close();
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] multiple chunks`, function() {
    it(`should work when called with just swSrc`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.b6f6b1b151c4f027ee1e1aa3061eeaf7.js';
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
          new InjectManifest({
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry2-17c2a1b5c94290899539.js',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support setting importWorkboxFrom to a chunk's name`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.77e720b5deee9dafb4df79d5e4c2f2e0.js';
      const workboxEntryName = 'workboxEntry-51dca2278b60b4b86e8c.js';
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          workboxEntry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            importWorkboxFrom: 'workboxEntry',
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
              importScripts: [[
                FILE_MANIFEST_NAME,
                workboxEntryName,
              ]],
              suppressWarnings: [[]],
              precacheAndRoute: [[[], {}]],
            }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry2-0c3c00f8cd0d3271089c.js',
          }, {
            url: 'entry1-3865b3908d1988da1758.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support setting importWorkboxFrom to 'local'`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.b6f6b1b151c4f027ee1e1aa3061eeaf7.js';
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
          new InjectManifest({
            importWorkboxFrom: 'local',
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // Validate the copied library files.
          const libraryFiles = glob.sync(`${WORKBOX_DIRECTORY_PREFIX}*/*.js*`,
            {cwd: outputDir});

          const modulePathPrefix = path.dirname(libraryFiles[0]);

          const basenames = libraryFiles.map((file) => path.basename(file));
          expect(basenames).to.eql(ALL_WORKBOX_FILES);

          // The correct importScripts path should use the versioned name of the
          // parent workbox libraries directory. We don't know that version ahead
          // of time, so we ensure that there's a match based on what actually
          // got copied over.
          const workboxSWImport = libraryFiles.filter(
            (file) => file.endsWith('workbox-sw.js'))[0];

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              workboxSWImport,
            ]],
            setConfig: [[{modulePathPrefix}]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry2-17c2a1b5c94290899539.js',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support setting importWorkboxFrom to 'local', and respect output.publicPath`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.1f4b80f3bf4cbdfc323cd47d280a9561.js';
      const outputDir = tempy.directory();
      const publicPath = 'https://testing.path/';
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
          publicPath,
        },
        plugins: [
          new InjectManifest({
            importWorkboxFrom: 'local',
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // Validate the copied library files.
          const libraryFiles = glob.sync(`${WORKBOX_DIRECTORY_PREFIX}*/*.js*`,
            {cwd: outputDir});

          const modulePathPrefix = path.dirname(libraryFiles[0]);

          const basenames = libraryFiles.map((file) => path.basename(file));
          expect(basenames).to.eql(ALL_WORKBOX_FILES);

          // The correct importScripts path should use the versioned name of the
          // parent workbox libraries directory. We don't know that version ahead
          // of time, so we ensure that there's a match based on what actually
          // got copied over.
          const workboxSWImport = libraryFiles.filter(
            (file) => file.endsWith('workbox-sw.js'))[0];

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              publicPath + FILE_MANIFEST_NAME,
              publicPath + workboxSWImport,
            ]],
            setConfig: [[{modulePathPrefix}]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: publicPath + 'entry2-a73dfbc0c0f27e33c997.js',
          }, {
            url: publicPath + 'entry1-72d0a5a3a44942369363.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should respect output.publicPath if importWorkboxFrom is set to a Webpack chunk name`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.c8c87b7b2af4d79242a895050ff70e48.js';
      const publicPath = 'https://testing.path/';
      const workboxChunkName = 'workbox-sw-chunk-name';

      const outputDir = tempy.directory();

      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          [workboxChunkName]: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
          publicPath,
        },
        plugins: [
          new InjectManifest({
            importWorkboxFrom: workboxChunkName,
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              publicPath + FILE_MANIFEST_NAME,
              `${publicPath}${workboxChunkName}-a045703b655e4960bca0.js`,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: publicPath + 'entry2-61ee477935384006abe1.js',
          }, {
            url: publicPath + 'entry1-2970939c7fd9c82eaf46.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'chunks' whitelist config`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.77e720b5deee9dafb4df79d5e4c2f2e0.js';
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            chunks: ['entry1', 'entry2'],
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry2-0c3c00f8cd0d3271089c.js',
          }, {
            url: 'entry1-3865b3908d1988da1758.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'excludeChunks' blacklist config`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.77e720b5deee9dafb4df79d5e4c2f2e0.js';
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            excludeChunks: ['entry3'],
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry2-0c3c00f8cd0d3271089c.js',
          }, {
            url: 'entry1-3865b3908d1988da1758.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor setting both the 'chunks' and 'excludeChunks', with the blacklist taking precedence`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.8b017100ab9e5377c63145f3034bae3f.js';
      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            chunks: ['entry1', 'entry2'],
            excludeChunks: ['entry2', 'entry3'],
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry1-3865b3908d1988da1758.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] html-webpack-plugin and a single chunk`, function() {
    it(`should work when called with just swSrc`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.3025354ee867087a8f380b661c2ed62f.js';
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
          new InjectManifest({
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: 'df7649048255d9f47e0f80cbe11cd4ef',
            url: 'index.html',
          }, {
            url: 'entry2-17c2a1b5c94290899539.js',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor a custom swDest and publicPath`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.06492856a9a2f9af91f132aa316c5572.js';
      const SW_DEST = 'custom-sw-dest.js';
      const publicPath = '/testing/';

      const outputDir = tempy.directory();
      const config = {
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
          publicPath,
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new InjectManifest({
            swDest: SW_DEST,
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, SW_DEST);
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              publicPath + FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: '35473c67acf1c2d0caffebd0cc31cbb5',
            url: publicPath + 'index.html',
          }, {
            url: publicPath + 'entry2-9700b0cb6282320b628f.js',
          }, {
            url: publicPath + 'entry1-ebb39acd9a53861a2a43.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support passing options through to workbox-build.getManifest() to precache additional files`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.06576212e1040579b494a559d9e82d3c.js';
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
          new InjectManifest({
            swSrc: SW_SRC,
            globDirectory: SRC_DIR,
            templatedUrls: {
              '/shell': ['index.html', 'styles/*.css'],
            },
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: 'df7649048255d9f47e0f80cbe11cd4ef',
            url: 'index.html',
          }, {
            url: 'entry2-17c2a1b5c94290899539.js',
          }, {
            url: 'entry1-d7f4e7088b64a9896b23.js',
          }, {
            revision: '5cfecbd12c9fa32f03eafe27e2ac798e',
            url: '/shell',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] copy-webpack-plugin and a single chunk`, function() {
    it(`should work when called with just swSrc`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.f7220180c1f86202aa3bd9ed1ef02890.js';
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
          new InjectManifest({
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: '8e8e9f093f036bd18dfa',
            url: 'webpackEntry.js',
          }, {
            revision: '884f6853a4fc655e4c2dc0c0f27a227c',
            url: 'styles/stylesheet-2.css',
          }, {
            revision: '934823cbc67ccf0d67aa2a2eeb798f12',
            url: 'styles/stylesheet-1.css',
          }, {
            revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
            url: 'page-2.html',
          }, {
            revision: '544658ab25ee8762dc241e8b1c5ed96d',
            url: 'page-1.html',
          }, {
            revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
            url: 'index.html',
          }, {
            revision: '93ffb20d77327583892ca47f597b77aa',
            url: 'images/web-fundamentals-icon192x192.png',
          }, {
            revision: '452b0a9f3978190f4c77997ab23473db',
            url: 'images/example-jpeg.jpg',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Filtering via test/include/exclude`, function() {
    const TEST_ASSET_CB = (compilation, callback) => callback(null, 'test');

    it(`should exclude .map and manifest.js(on) files by default`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.43591bdf46c7ac47eb8d7b2bcd41f13e.js';
      const outputDir = tempy.directory();
      const config = {
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new GenerateAssetPlugin({
            filename: 'manifest.js',
            fn: TEST_ASSET_CB,
          }),
          new GenerateAssetPlugin({
            filename: 'manifest.json',
            fn: TEST_ASSET_CB,
          }),
          new InjectManifest({
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: '8e8e9f093f036bd18dfa',
            url: 'webpackEntry.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to override the default exclude filter`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.b87ef85173e527290f94979b09e72d12.js';
      const outputDir = tempy.directory();
      const config = {
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new InjectManifest({
            exclude: [],
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: '8e8e9f093f036bd18dfa',
            url: 'webpackEntry.js.map',
          }, {
            revision: '8e8e9f093f036bd18dfa',
            url: 'webpackEntry.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to whitelist via include`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.1242f9e007897f035a52e56690ff17a6.js';
      const outputDir = tempy.directory();
      const config = {
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new CopyWebpackPlugin([{
            from: SRC_DIR,
            to: outputDir,
          }]),
          new InjectManifest({
            include: [/.html$/],
            swSrc: SW_SRC,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
            url: 'page-2.html',
          }, {
            revision: '544658ab25ee8762dc241e8b1c5ed96d',
            url: 'page-1.html',
          }, {
            revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
            url: 'index.html',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to combine the test and exclude filters`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.83df65831eb442f8ad5fbeb8edecc558.js';
      const outputDir = tempy.directory();
      const config = {
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new CopyWebpackPlugin([{
            from: SRC_DIR,
            to: outputDir,
          }]),
          new InjectManifest({
            swSrc: SW_SRC,
            test: [/.html$/],
            exclude: [/index/],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, path.basename(SW_SRC));
        try {
          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [[
              FILE_MANIFEST_NAME,
              WORKBOX_SW_FILE_NAME,
            ]],
            suppressWarnings: [[]],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
            url: 'page-2.html',
          }, {
            revision: '544658ab25ee8762dc241e8b1c5ed96d',
            url: 'page-1.html',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkerPlugin = require('worker-plugin');
const expect = require('chai').expect;
const fse = require('fs-extra');
const globby = require('globby');
const upath = require('upath');
const tempy = require('tempy');
const webpack = require('webpack');

const CreateWebpackAssetPlugin = require('../../../infra/testing/create-webpack-asset-plugin');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');
const webpackBuildCheck = require('../../../infra/testing/webpack-build-check');
const {InjectManifest} = require('../../../packages/workbox-webpack-plugin/src/index');

describe(`[workbox-webpack-plugin] InjectManifest (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = upath.join(__dirname, '..', 'static', 'example-project-1');
  const SW_SRC = upath.join(__dirname, '..', 'static', 'sw-src.js');

  describe(`[workbox-webpack-plugin] Runtime errors`, function() {
    it(`should lead to a webpack compilation error when passed invalid config`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            invalid: 'invalid',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run((webpackError, stats) => {
        expect(webpackError).not.to.exist;
        const statsJson = stats.toJson();
        expect(statsJson.warnings).to.be.empty;
        expect(statsJson.errors).to.have.members([
          `Please check your InjectManifest plugin configuration:\n"invalid" is not a supported parameter.`,
        ]);

        done();
      });
    });
  });

  describe(`[workbox-webpack-plugin] Multiple chunks`, function() {
    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                }, {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry2-20_CHARACTER_HASH.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'chunks' allowlist config`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            chunks: ['entry1', 'entry2'],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                }, {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry2-20_CHARACTER_HASH.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'chunks' allowlist config, including children created via SplitChunksPlugin`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          main: upath.join(SRC_DIR, 'splitChunksEntry.js'),
        },
        output: {
          chunkFilename: '[name].js',
          filename: 'main.js',
          path: outputDir,
        },
        optimization: {
          splitChunks: {
            chunks: 'all',
          },
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            chunks: ['main'],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'main.js',
                }, {
                  revision: '32_CHARACTER_HASH',
                  url: 'vendors~main.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'excludeChunks' denylist config`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            excludeChunks: ['entry3'],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                }, {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry2-20_CHARACTER_HASH.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor setting both the 'chunks' and 'excludeChunks', with the denylist taking precedence`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            chunks: ['entry1', 'entry2'],
            excludeChunks: ['entry2', 'entry3'],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] html-webpack-plugin and a single chunk`, function() {
    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                }, {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry2-20_CHARACTER_HASH.js',
                }, {
                  revision: '32_CHARACTER_HASH',
                  url: 'index.html',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] copy-webpack-plugin and a single chunk`, function() {
    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(10);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'images/example-jpeg.jpg',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'images/web-fundamentals-icon192x192.png',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'index.html',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'page-1.html',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'page-2.html',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'splitChunksEntry.js',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'styles/stylesheet-1.css',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'styles/stylesheet-2.css',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'webpackEntry.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Sourcemap manipulation`, function() {
    it(`should update the sourcemap to account for manifest injection`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          const expectedSourcemap = await fse.readJSON(
              upath.join(__dirname, '..', 'static', 'expected-service-worker.js.map'));
          const actualSourcemap = await fse.readJSON(upath.join(outputDir, 'service-worker.js.map'));

          // The mappings will vary depending on the webpack version.
          delete expectedSourcemap.mappings;
          delete actualSourcemap.mappings;

          expect(actualSourcemap).to.eql(expectedSourcemap);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should handle a custom output.sourceMapFilename`, function(done) {
      const outputDir = tempy.directory();

      const sourceMapFilename = upath.join('subdir', '[file].map');
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          sourceMapFilename,
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          const expectedSourcemap = await fse.readJSON(
              upath.join(__dirname, '..', 'static', 'expected-service-worker.js.map'));
          const actualSourcemap = await fse.readJSON(
              upath.join(outputDir, 'subdir', 'service-worker.js.map'));

          // The mappings will vary depending on the webpack version.
          delete expectedSourcemap.mappings;
          delete actualSourcemap.mappings;

          expect(actualSourcemap).to.eql(expectedSourcemap);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should not fail if the sourcemap is missing from the assets`, function(done) {
      const outputDir = tempy.directory();
      const swSrc = upath.join(__dirname, '..', 'static', 'sw-src-missing-sourcemap.js');

      const config = {
        mode: 'development',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: false,
        plugins: [
          new InjectManifest({
            swSrc,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Filtering via include/exclude`, function() {
    it(`should exclude .map and manifest.js files by default`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new CreateWebpackAssetPlugin('manifest.js'),
          new CreateWebpackAssetPlugin('manifest.json'),
          new CreateWebpackAssetPlugin('not-ignored.js'),
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(7);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'manifest.json',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'not-ignored.js',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to override the default exclude filter`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'source-map',
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            exclude: [],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'service-worker.js.map',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js.map',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to allowlist via include`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
            swDest: 'service-worker.js',
            include: [/.html$/],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(10);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'index.html',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'page-1.html',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'page-2.html',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to combine the include and exclude filters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
            swDest: 'service-worker.js',
            include: [/.html$/],
            exclude: [/index/],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(10);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'page-1.html',
              }, {
                revision: '32_CHARACTER_HASH',
                url: 'page-2.html',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] swDest variations`, function() {
    it(`should work when swDest is an absolute path`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: upath.resolve(upath.join(outputDir, 'service-worker.js')),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'webpackEntry.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Reporting webpack warnings`, function() {
    it(`should warn when when passed a non-existent chunk`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            chunks: ['entry1', 'doesNotExist'],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          expect(webpackError).not.to.exist;
          const statsJson = stats.toJson();
          expect(statsJson.errors).to.be.empty;
          expect(statsJson.warnings).to.have.members([
            `The chunk 'doesNotExist' was provided in your Workbox chunks config, but was not found in the compilation.`,
          ]);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should add maximumFileSizeToCacheInBytes warnings to compilation.warnings`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new CopyWebpackPlugin([{
            from: SRC_DIR,
            to: outputDir,
          }]),
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            // Make this large enough to cache some, but not all, files.
            maximumFileSizeToCacheInBytes: 14 * 1024,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        if (webpackError) {
          return done(webpackError);
        }

        try {
          const statsJson = stats.toJson('verbose');
          expect(statsJson.warnings).to.have.members([
            `images/example-jpeg.jpg is 15.3 kB, and won't be precached. Configure maximumFileSizeToCacheInBytes to change this limit.`,
          ]);

          const swFile = upath.join(outputDir, 'service-worker.js');

          const files = await globby(outputDir);
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'entry1-20_CHARACTER_HASH.js',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'images/web-fundamentals-icon192x192.png',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'index.html',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'page-1.html',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'page-2.html',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'splitChunksEntry.js',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'styles/stylesheet-1.css',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'styles/stylesheet-2.css',
                },
                {
                  revision: '32_CHARACTER_HASH',
                  url: 'webpackEntry.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Customizing output paths and names`, function() {
    it(`should honor publicPath`, function(done) {
      const outputDir = tempy.directory();
      const publicPath = '/testing/';
      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          publicPath,
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[
                {
                  revision: '32_CHARACTER_HASH',
                  url: '/testing/entry1-20_CHARACTER_HASH.js',
                },
              ], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] WASM Code`, function() {
    // See https://github.com/GoogleChrome/workbox/issues/1916
    it(`should support projects that bundle WASM code`, function(done) {
      const outputDir = tempy.directory();
      const srcDir = upath.join(__dirname, '..', 'static', 'wasm-project');
      const config = {
        mode: 'production',
        entry: {
          index: upath.join(srcDir, 'index.js'),
        },
        output: {
          filename: '[name].js',
          globalObject: 'self',
          path: outputDir,
        },
        plugins: [
          new WorkerPlugin(),
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          // Bundling WASM into a Worker seems to lead to different hashes in
          // different environments. Instead of hardcoding hash checks, just
          // confirm that we output the expected number of files, which will
          // only be true if the build was successful.
          const files = await globby(outputDir);
          expect(files).to.have.length(5);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Manifest transformations`, function() {
    it(`should use dontCacheBustURLsMatching`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            dontCacheBustURLsMatching: /\.[0-9a-f]{20}\./,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                url: 'main.20_CHARACTER_HASH.js',
                revision: null,
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should use modifyURLPrefix`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:20].js',
          path: outputDir,
          publicPath: '/public/',
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            modifyURLPrefix: {
              '/public/': 'https://example.org/',
            },
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'https://example.org/main.20_CHARACTER_HASH.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should use manifestTransforms`, function(done) {
      const outputDir = tempy.directory();
      const warningMessage = 'test warning';
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
            manifestTransforms: [(manifest, compilation) => {
              expect(manifest).to.have.lengthOf(1);
              expect(manifest[0].size).to.eql(930);
              expect(manifest[0].url.startsWith('main.')).to.be.true;
              expect(manifest[0].revision).to.have.lengthOf(32);
              expect(compilation).to.exist;

              manifest = manifest.map((entry) => {
                entry.url += '-suffix';
                entry.revision = null;
                return entry;
              });

              return {
                manifest,
                warnings: [warningMessage],
              };
            }],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          expect(webpackError).not.to.exist;
          const statsJson = stats.toJson();
          expect(statsJson.errors).to.be.empty;
          expect(statsJson.warnings).to.have.members([warningMessage]);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: null,
                url: 'main.20_CHARACTER_HASH.js-suffix',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] TypeScript compilation`, function() {
    it(`should rename a swSrc with a .ts extension to .js`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:6].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: upath.join(__dirname, '..', 'static', 'sw.ts'),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('*', {cwd: outputDir});
          expect(files).to.contain('sw.js');

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Multiple invocation scenarios`, function() {
    // See https://github.com/GoogleChrome/workbox/issues/2158
    it(`should support multiple compilations using the same plugin instance`, async function() {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:6].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      for (const i of [1, 2, 3]) {
        await new Promise((resolve, reject) => {
          compiler.run(async (webpackError, stats) => {
            try {
              if (webpackError) {
                throw new Error(webpackError.message);
              }

              const statsJson = stats.toJson('verbose');
              expect(statsJson.errors).to.have.length(0);

              // There should be a warning logged after the first compilation.
              // See https://github.com/GoogleChrome/workbox/issues/1790
              if (i > 1) {
                expect(statsJson.warnings).to.have.length(1);
              } else {
                expect(statsJson.warnings).to.have.length(0);
              }

              const files = await globby(outputDir);
              expect(files).to.have.length(2);

              resolve();
            } catch (error) {
              reject(new Error(`Failure during compilation ${i}: ${error}`));
            }
          });
        });
      }
    });
  });

  describe(`[workbox-webpack-plugin] Multiple plugin instances`, function() {
    // See https://github.com/GoogleChrome/workbox/issues/2181
    it(`should not list the swDest from one plugin in the other's manifest`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            exclude: [/sw\d.js/],
            swSrc: upath.join(__dirname, '..', 'static', 'sw.ts'),
            swDest: 'sw1.js',
          }),
          new InjectManifest({
            exclude: [/sw\d.js/],
            swSrc: upath.join(__dirname, '..', 'static', 'sw.ts'),
            swDest: 'sw2.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const sw1File = upath.join(outputDir, 'sw1.js');
        const sw2File = upath.join(outputDir, 'sw2.js');

        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile: sw1File,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'main.20_CHARACTER_HASH.js',
              }], {}]],
            },
          });

          await validateServiceWorkerRuntime({
            swFile: sw2File,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'main.20_CHARACTER_HASH.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Manifest injection in development mode`, function() {
    it(`should produce valid, parsable JavaScript`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'development',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            exclude: [/sw\d.js/],
            swDest: 'sw.js',
            swSrc: upath.join(__dirname, '..', 'static', 'sw-src.js'),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'sw.js');

        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile: swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [[[{
                revision: '32_CHARACTER_HASH',
                url: 'main.20_CHARACTER_HASH.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

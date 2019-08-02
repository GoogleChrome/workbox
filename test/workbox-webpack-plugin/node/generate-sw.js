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
const globby = require('globby');
const upath = require('upath');
const tempy = require('tempy');
const webpack = require('webpack');

const CreateWebpackAssetPlugin = require('../../../infra/testing/create-webpack-asset-plugin');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');
const webpackBuildCheck = require('../../../infra/testing/webpack-build-check');
const {GenerateSW} = require('../../../packages/workbox-webpack-plugin/src/index');

describe(`[workbox-webpack-plugin] GenerateSW (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = upath.join(__dirname, '..', 'static', 'example-project-1');

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
          new GenerateSW({
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
          `Please check your GenerateSW plugin configuration:\n"invalid" is not a supported parameter.`,
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
          new GenerateSW(),
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
            swFile, expectedMethodCalls: {
              importScripts: [],
              precacheAndRoute: [[[
                {
                  revision: '0fae6a991467bd40263a3ba8cd82835d',
                  url: 'entry1-43ba396bf52f8419e349.js',
                }, {
                  revision: '0fae6a991467bd40263a3ba8cd82835d',
                  url: 'entry2-aa21f43434f29ed0c946.js',
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

    it(`should work when called with importScriptsViaChunks`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        devtool: 'source-map',
        entry: {
          main: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          imported: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            importScriptsViaChunks: [
              'imported',
              'INVALID_CHUNK_NAME',
            ],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          const statsJson = stats.toJson('verbose');
          expect(webpackError).not.to.exist;
          expect(statsJson.errors).to.be.empty;
          // There should be a warning logged, due to INVALID_CHUNK_NAME.
          expect(statsJson.warnings).to.have.length(1);

          const files = await globby(outputDir);
          expect(files).to.have.length(8);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              // imported-[chunkhash].js.map should *not* be included.
              importScripts: [
                ['imported-1f6b183815996bd3f526.js'],
              ],
              // imported-[chunkhash].js should *not* be included.
              precacheAndRoute: [[[{
                revision: '39e9dd73c0daacacec3ea359cd47394a',
                url: 'main-01a6ea3dea62d17888bb.js',
              }], {}]],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should work when called with additionalManifestEntries`, function(done) {
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
          new GenerateSW({
            additionalManifestEntries: [
              '/one',
              {url: '/two', revision: null},
              {url: '/three', revision: '333'},
            ],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          const statsJson = stats.toJson();
          expect(webpackError).not.to.exist;
          expect(statsJson.errors).to.be.empty;
          // The string additionalManifestEntries entry should lead to one warning.
          expect(statsJson.warnings).to.have.length(1);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              importScripts: [],
              precacheAndRoute: [[[
                {
                  revision: '0fae6a991467bd40263a3ba8cd82835d',
                  url: 'entry1-43ba396bf52f8419e349.js',
                }, {
                  revision: '0fae6a991467bd40263a3ba8cd82835d',
                  url: 'entry2-aa21f43434f29ed0c946.js',
                }, '/one', {
                  revision: '333',
                  url: '/three',
                }, {
                  revision: null,
                  url: '/two',
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

    it(`should honor the 'chunks' whitelist config`, function(done) {
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
          new GenerateSW({
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
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry1-46499ea335097c2d5d28.js',
              }, {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry2-3b4a9899eba6f4fd5880.js',
              },
            ], {}]],
          }});

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'chunks' whitelist config, including children created via SplitChunksPlugin`, function(done) {
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
          new GenerateSW({
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
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: '112b1ad19c141f739a7ef2b803e83a6d',
                url: 'main.js',
              }, {
                revision: '279ad728ece4fb6ea9c9e884bb3179a3',
                url: 'vendors~main.js',
              },
            ], {}]],
          }});

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'excludeChunks' blacklist config`, function(done) {
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
          new GenerateSW({
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
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry1-46499ea335097c2d5d28.js',
              }, {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry2-3b4a9899eba6f4fd5880.js',
              },
            ], {}]],
          }});

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor setting both the 'chunks' and 'excludeChunks', with the blacklist taking precedence`, function(done) {
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
          new GenerateSW({
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
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry1-46499ea335097c2d5d28.js',
              },
            ], {}]],
          }});

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
          new GenerateSW(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry1-43ba396bf52f8419e349.js',
              }, {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry2-aa21f43434f29ed0c946.js',
              }, {
                revision: 'ebc41a064b42558847b35b3ec152df5d',
                url: 'index.html',
              },
            ], {}]],
          }});

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
          new GenerateSW(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              importScripts: [],
              precacheAndRoute: [[[
                {
                  revision: '452b0a9f3978190f4c77997ab23473db',
                  url: 'images/example-jpeg.jpg',
                },
                {
                  revision: '93ffb20d77327583892ca47f597b77aa',
                  url: 'images/web-fundamentals-icon192x192.png',
                },
                {
                  revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
                  url: 'index.html',
                },
                {
                  revision: '544658ab25ee8762dc241e8b1c5ed96d',
                  url: 'page-1.html',
                },
                {
                  revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
                  url: 'page-2.html',
                },
                {
                  revision: '54befe539fc77e7b88106abd6ae0fc9c',
                  url: 'splitChunksEntry.js',
                },
                {
                  revision: '934823cbc67ccf0d67aa2a2eeb798f12',
                  url: 'styles/stylesheet-1.css',
                },
                {
                  revision: '884f6853a4fc655e4c2dc0c0f27a227c',
                  url: 'styles/stylesheet-2.css',
                },
                {
                  revision: '0fae6a991467bd40263a3ba8cd82835d',
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
          new GenerateSW(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(9);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              revision: '4b1eb3dc48c4e16d49db5b42298fe654',
              url: 'manifest.json',
            }, {
              revision: 'aef75af28f6de0771a8d6bae84d9e71d',
              url: 'not-ignored.js',
            }, {
              revision: '35ecfdff688561581ddd68a107ef1c46',
              url: 'webpackEntry.js',
            }], {}]],
          }});

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
          new GenerateSW({
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
          expect(files).to.have.length(6);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              revision: '35ecfdff688561581ddd68a107ef1c46',
              url: 'webpackEntry.js',
            }, {
              revision: '258242b5a4bd3172868f906ad1b16a6e',
              url: 'webpackEntry.js.map',
            }], {}]],
          }});

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to whitelist via include`, function(done) {
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
          new GenerateSW({
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
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
              url: 'index.html',
            }, {
              revision: '544658ab25ee8762dc241e8b1c5ed96d',
              url: 'page-1.html',
            }, {
              revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
              url: 'page-2.html',
            }], {}]],
          }});

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
          new GenerateSW({
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
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              revision: '544658ab25ee8762dc241e8b1c5ed96d',
              url: 'page-1.html',
            }, {
              revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
              url: 'page-2.html',
            }], {}]],
          }});

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
          new GenerateSW({
            // upath.resolve() will always return an absolute upath.
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
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              revision: '0fae6a991467bd40263a3ba8cd82835d',
              url: 'webpackEntry.js',
            }], {}]],
          }});

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
          new GenerateSW({
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
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              importScripts: [],
              precacheAndRoute: [[[
                {
                  revision: '0fae6a991467bd40263a3ba8cd82835d',
                  url: 'entry1-534729ef1c2ff611b64f.js',
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
          new GenerateSW({
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
          expect(files).to.have.length(12);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                url: 'entry1-534729ef1c2ff611b64f.js',
              },
              {
                revision: '93ffb20d77327583892ca47f597b77aa',
                url: 'images/web-fundamentals-icon192x192.png',
              },
              {
                revision: '3883c45b119c9d7e9ad75a1b4a4672ac',
                url: 'index.html',
              },
              {
                revision: '544658ab25ee8762dc241e8b1c5ed96d',
                url: 'page-1.html',
              },
              {
                revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
                url: 'page-2.html',
              },
              {
                revision: '54befe539fc77e7b88106abd6ae0fc9c',
                url: 'splitChunksEntry.js',
              },
              {
                revision: '934823cbc67ccf0d67aa2a2eeb798f12',
                url: 'styles/stylesheet-1.css',
              },
              {
                revision: '884f6853a4fc655e4c2dc0c0f27a227c',
                url: 'styles/stylesheet-2.css',
              },
              {
                revision: 'd5242cbe60934575bd2d4f4161aeada1',
                url: 'webpackEntry.js',
              },
            ], {}]],
          }});

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
          new GenerateSW(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[
              {
                revision: 'c00d58015497c84d6fa4eaa9ee31678d',
                url: '/testing/entry1-4357f117964871c288d9.js',
              },
            ], {}]],
          }});

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
          new GenerateSW(),
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
          expect(files).to.have.length(6);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Rollup plugin configuration options`, function() {
    it(`should support inlining the Workbox runtime`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:6].js',
          path: outputDir,
          publicPath: '/public/',
        },
        plugins: [
          new GenerateSW({
            inlineWorkboxRuntime: true,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          // We can't really mock evaluation of the service worker script when
          // the Workbox runtime is inlined, so just check to make sure the
          // correct files are output.
          const files = await globby(outputDir);
          expect(files).to.have.length(2);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support inlining the Workbox runtime and generating sourcemaps`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[hash:6].js',
          path: outputDir,
          publicPath: '/public/',
        },
        plugins: [
          new GenerateSW({
            inlineWorkboxRuntime: true,
            sourcemap: true,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          // We can't really mock evaluation of the service worker script when
          // the Workbox runtime is inlined, so just check to make sure the
          // correct files are output.
          const files = await globby(outputDir);
          expect(files).to.have.length(3);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support using a swDest that includes a subdirectory`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            swDest: upath.join('sub', 'directory', 'service-worker.js'),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          // Make sure that the expected generated service worker files are
          // output into the subdirectory.
          const files = await globby('**/*', {
            cwd: upath.join(outputDir, 'sub', 'directory'),
          });
          expect(files).to.have.length(2);

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
          filename: '[name].[hash:6].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            dontCacheBustURLsMatching: /\.[0-9a-f]{6}\./,
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

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              url: 'main.f70b1e.js',
            }], {}]],
          }});

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
          filename: '[name].[hash:6].js',
          path: outputDir,
          publicPath: '/public/',
        },
        plugins: [
          new GenerateSW({
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
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              revision: 'eeb107dbf9e69f1a6184e616f38bab47',
              url: 'https://example.org/main.a3c534.js',
            }], {}]],
          }});

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
          filename: '[name].[hash:6].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            manifestTransforms: [(manifest, compilation) => {
              expect(manifest).to.eql([{
                revision: '0fae6a991467bd40263a3ba8cd82835d',
                size: 930,
                url: 'main.f70b1e.js',
              }]);
              expect(compilation).to.exist;

              manifest = manifest.map((entry) => {
                entry.url += '-suffix';
                delete entry.revision;
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
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [],
            precacheAndRoute: [[[{
              url: 'main.f70b1e.js-suffix',
            }], {}]],
          }});

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

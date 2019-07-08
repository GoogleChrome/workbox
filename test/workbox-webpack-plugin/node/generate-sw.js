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
const path = require('path');
const tempy = require('tempy');
const vm = require('vm');
const webpack = require('webpack');

const CreateWebpackAssetPlugin = require('../../../infra/testing/create-webpack-asset-plugin');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');
const webpackBuildCheck = require('../../../infra/testing/webpack-build-check');
const {GenerateSW} = require('../../../packages/workbox-webpack-plugin/src/index');

describe(`[workbox-webpack-plugin] GenerateSW (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = path.join(__dirname, '..', 'static', 'example-project-1');

  describe(`[workbox-webpack-plugin] runtime errors`, function() {
    it(`should lead to a webpack compilation error when passed invalid config`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        if (webpackError) {
          done(new Error(`An unexpected error was thrown: ${webpackError.message}`));
        } else {
          const statsJson = stats.toJson('verbose');
          expect(statsJson.errors).to.have.members([
            `Please check your GenerateSW plugin configuration:\n'invalid' is not a supported parameter.`,
          ]);
          done();
        }
      });
    });

    it(`should warn when when passed a non-existent chunk`, function(done) {
      done('tbd');
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
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
  });

  describe(`[workbox-webpack-plugin] multiple chunks`, function() {
    it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
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

    it(`should honor the 'chunks' whitelist config`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
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
          new GenerateSW({
            chunks: ['entry1', 'entry2'],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
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
          main: path.join(SRC_DIR, 'splitChunksEntry.js'),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            precacheAndRoute: [[[
              {
                revision: '112b1ad19c141f739a7ef2b803e83a6d',
                url: 'main.js',
              }, {
                revision: 'dbbbfa8b60f4f49cb7a2e8448842ad19',
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
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
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
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry3: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
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
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          entry2: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
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
          new GenerateSW(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
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
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(9);

          // First, validate that the generated service-worker.js meets some basic assumptions.
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
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
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
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(6);

          // First, validate that the generated service-worker.js meets some basic assumptions.
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
          new GenerateSW({
            include: [/.html$/],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(11);

          // First, validate that the generated service-worker.js meets some basic assumptions.
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
          new GenerateSW({
            include: [/.html$/],
            exclude: [/index/],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby(outputDir);
          expect(files).to.have.length(11);

          // First, validate that the generated service-worker.js meets some basic assumptions.
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
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            // path.resolve() will always return an absolute path.
            swDest: path.resolve(path.join(outputDir, 'service-worker.js')),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        if (webpackError) {
          return done(webpackError);
        }

        const swFile = path.join(outputDir, 'service-worker.js');
        try {
          const statsJson = stats.toJson('verbose');
          expect(statsJson.warnings).to.have.lengthOf(0);

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [
              [WORKBOX_SW_FILE_NAME],
              [FILE_MANIFEST_NAME],
            ],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            revision: '305798792eeffe140f78',
            url: 'webpackEntry.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Reporting webpack warnings`, function() {
    it(`should add warnings from the workbox-build methods to compilation.warnings`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.7e1d0d5a77c9c05655b6033e320028e3.js';
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          // This is not an exhaustive test of all the supported options, but
          // it should be enough to confirm that they're being interpreted
          // by workbox-build.generateSWString() properly.
          new GenerateSW({
            globDirectory: SRC_DIR,
            globPatterns: ['**/*'],
            // Make this large enough to cache some, but not all, files.
            maximumFileSizeToCacheInBytes: 20,
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
          expect(statsJson.warnings).to.have.lengthOf(7);

          const swFile = path.join(outputDir, 'service-worker.js');

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [
              [WORKBOX_SW_FILE_NAME],
              [FILE_MANIFEST_NAME],
            ],
            precacheAndRoute: [[[{
              revision: '544658ab25ee8762dc241e8b1c5ed96d',
              url: 'page-1.html',
            }, {
              revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
              url: 'page-2.html',
            }], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry1-534729ef1c2ff611b64f.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should add a warning when various glob-related options are set`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.7e1d0d5a77c9c05655b6033e320028e3.js';
      const outputDir = tempy.directory();
      const globOptionsToWarnAbout = [
        'globDirectory',
        'globFollow',
        'globIgnores',
        'globPatterns',
        'globStrict',
      ];
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            globDirectory: SRC_DIR,
            globFollow: true,
            globIgnores: ['ignored'],
            globPatterns: ['**/*.html'],
            globStrict: true,
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
          expect(statsJson.warnings).to.have.lengthOf(1);
          for (const globOptionToWarnAbout of globOptionsToWarnAbout) {
            expect(statsJson.warnings[0]).to.include(globOptionToWarnAbout);
          }

          const swFile = path.join(outputDir, 'service-worker.js');

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [
              [WORKBOX_SW_FILE_NAME],
              [FILE_MANIFEST_NAME],
            ],
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

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry1-534729ef1c2ff611b64f.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should add a warning when certain options are used, but globPatterns isn't set`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.7e1d0d5a77c9c05655b6033e320028e3.js';
      const outputDir = tempy.directory();
      const optionsToWarnAboutWhenGlobPatternsIsNotSet = [
        'dontCacheBustURLsMatching',
        'manifestTransforms',
        'maximumFileSizeToCacheInBytes',
        'modifyURLPrefix',
      ];
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            dontCacheBustURLsMatching: /testing/,
            manifestTransforms: [],
            maximumFileSizeToCacheInBytes: 1000000,
            modifyURLPrefix: {abc: 'def'},
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
          expect(statsJson.warnings).to.have.lengthOf(1);
          for (const optionToWarnAboutWhenGlobPatternsIsNotSet of optionsToWarnAboutWhenGlobPatternsIsNotSet) {
            expect(statsJson.warnings[0]).to.include(optionToWarnAboutWhenGlobPatternsIsNotSet);
          }

          const swFile = path.join(outputDir, 'service-worker.js');

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({swFile, expectedMethodCalls: {
            importScripts: [
              [WORKBOX_SW_FILE_NAME],
              [FILE_MANIFEST_NAME],
            ],
            precacheAndRoute: [[[], {}]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry1-534729ef1c2ff611b64f.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Customizing output paths and names`, function() {
    it(`should allow overriding precacheManifestFilename`, function(done) {
      const FILE_MANIFEST_NAME = 'custom-name.7e1d0d5a77c9c05655b6033e320028e3.js';
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            precacheManifestFilename: 'custom-name.[manifestHash].js',
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
          expect(statsJson.warnings).to.have.lengthOf(0);

          const swFile = path.join(outputDir, 'service-worker.js');

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              importScripts: [
                [WORKBOX_SW_FILE_NAME],
                [FILE_MANIFEST_NAME],
              ],
              precacheAndRoute: [[[], {}]],
            }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry1-534729ef1c2ff611b64f.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow setting importsDirectory`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.7e1d0d5a77c9c05655b6033e320028e3.js';
      const outputDir = tempy.directory();
      const importsDirectory = path.join('one', 'two');
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            importsDirectory,
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
          expect(statsJson.warnings).to.have.lengthOf(0);

          const swFile = path.join(outputDir, 'service-worker.js');

          // First, validate that the generated service-worker.js meets some basic assumptions.
          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              importScripts: [
                [WORKBOX_SW_FILE_NAME],
                [importsDirectory.replace(path.sep, '/') + '/' + FILE_MANIFEST_NAME],
              ],
              precacheAndRoute: [[[], {}]],
            }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(
              path.join(outputDir, importsDirectory, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: 'entry1-534729ef1c2ff611b64f.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow setting importsDirectory, publicPath, and importWorkboxFrom: 'local'`, function(done) {
      const FILE_MANIFEST_NAME = 'precache-manifest.0a5a96f075807fd5ebca92528f0a5156.js';
      const outputDir = tempy.directory();
      const importsDirectory = path.join('one', 'two');
      const publicPath = '/testing/';
      const config = {
        mode: 'production',
        entry: {
          entry1: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          publicPath,
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            importsDirectory,
            importWorkboxFrom: 'local',
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
          expect(statsJson.warnings).to.have.lengthOf(0);

          const swFile = path.join(outputDir, 'service-worker.js');

          // Validate the copied library files.
          const libraryFiles = glob.sync(`${WORKBOX_DIRECTORY_PREFIX}*/*.+(js|mjs)*`,
              {cwd: path.join(outputDir, importsDirectory)});

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
          await validateServiceWorkerRuntime({
            swFile, expectedMethodCalls: {
              importScripts: [
                [publicPath + importsDirectory.replace(path.sep, '/') + '/' + workboxSWImport],
                [publicPath + importsDirectory.replace(path.sep, '/') + '/' + FILE_MANIFEST_NAME],
              ],
              setConfig: [[{modulePathPrefix: publicPath + importsDirectory.replace(path.sep, '/') + '/' + modulePathPrefix}]],
              precacheAndRoute: [[[], {}]],
            }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(
              path.join(outputDir, importsDirectory, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);

          const expectedEntries = [{
            url: publicPath + 'entry1-4357f117964871c288d9.js',
          }];
          expect(context.self.__precacheManifest).to.eql(expectedEntries);

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
      const indexFilename = 'index.js';
      const outputDir = tempy.directory();
      const srcDir = path.join(__dirname, '..', 'static', 'wasm-project');
      const config = {
        mode: 'production',
        entry: {
          index: path.join(srcDir, indexFilename),
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
        if (webpackError) {
          return done(webpackError);
        }

        try {
          const statsJson = stats.toJson('verbose');
          expect(statsJson.warnings).to.have.lengthOf(0);

          // Bundling WASM into a Worker seems to lead to different hashes in
          // different environments. Instead of hardcoding hash checks, just
          // confirm that we output the expected number of files, which will
          // only be true if the build was successful.
          const files = glob.sync(`${outputDir}/*`);
          expect(files).to.have.length(6);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

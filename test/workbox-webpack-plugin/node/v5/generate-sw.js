/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// workbox-webpack-plugin needs to do require('webpack'), and in order to test
// against multiple webpack versions, we need that to resolve to whatever the
// correct webpack is for this test.
// See https://jeffy.info/2020/10/01/testing-multiple-webpack-versions.html
try {
  delete require.cache[require.resolve('html-webpack-plugin')];
  delete require.cache[require.resolve('webpack')];
} catch (error) {
  // Ignore if require.resolve() fails.
}
const upath = require('upath');
const moduleAlias = require('module-alias');
moduleAlias.addAlias(
  'html-webpack-plugin',
  upath.resolve('node_modules', 'html-webpack-plugin-v5'),
);
moduleAlias.addAlias('webpack', upath.resolve('node_modules', 'webpack-v5'));

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MemoryFS = require('memory-fs');
const expect = require('chai').expect;
const globby = require('globby');
const tempy = require('tempy');
const webpack = require('webpack');

const CreateWebpackAssetPlugin = require('./lib/create-webpack-asset-plugin');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');
const webpackBuildCheck = require('../../../../infra/testing/webpack-build-check');
const {
  GenerateSW,
} = require('../../../../packages/workbox-webpack-plugin/build/generate-sw');

describe(`[workbox-webpack-plugin] GenerateSW with webpack v5`, function () {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = upath.join(
    __dirname,
    '..',
    '..',
    'static',
    'example-project-1',
  );

  describe(`[workbox-webpack-plugin] Runtime errors`, function () {
    it(`should lead to a webpack compilation error when passed invalid config`, function (done) {
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
        try {
          expect(webpackError).not.to.exist;
          const statsJson = stats.toJson();
          expect(statsJson.warnings).to.be.empty;
          expect(statsJson.errors).to.have.length(1);
          expect(statsJson.errors[0].message).to.eql(
            `Please check your GenerateSW plugin configuration:\n[WebpackGenerateSW] 'invalid' property is not expected to be here. Did you mean property 'include'?`,
          );

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Multiple chunks`, function () {
    it(`should work when called without any parameters`, function (done) {
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
        plugins: [new GenerateSW()],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: /^entry2-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should work when called with importScriptsViaChunks`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        devtool: 'source-map',
        entry: {
          main: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
          imported: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash:20].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            importScriptsViaChunks: ['imported', 'INVALID_CHUNK_NAME'],
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(8);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              // imported-[chunkhash].js.map should *not* be included.
              importScripts: [
                [/^\.\/workbox-[0-9a-f]{8}$/],
                [/^imported-[0-9a-f]{20}\.js$/],
              ],
              // imported-[chunkhash].js should *not* be included.
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should work when called with additionalManifestEntries`, function (done) {
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
              {url: 'one', revision: null},
              {url: 'two', revision: null},
              {url: 'three', revision: '333'},
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
          expect(statsJson.warnings).to.have.length(0);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: /^entry2-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: 'one',
                    },
                    {
                      revision: '333',
                      url: 'three',
                    },
                    {
                      revision: null,
                      url: 'two',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'chunks' allowlist config`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: /^entry2-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'chunks' allowlist config, including children created via SplitChunksPlugin`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: {
          main: upath.join(SRC_DIR, 'splitChunksEntry.js'),
        },
        output: {
          filename: '[chunkhash].js',
          path: outputDir,
        },
        optimization: {
          minimize: false,
          splitChunks: {
            chunks: 'all',
          },
        },
        performance: {
          hints: false,
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: /^[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor the 'excludeChunks' denylist config`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: /^entry2-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should honor setting both the 'chunks' and 'excludeChunks', with the denylist taking precedence`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] html-webpack-plugin and a single chunk`, function () {
    it(`should work when called without any parameters`, function (done) {
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
        plugins: [new HtmlWebpackPlugin(), new GenerateSW()],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(5);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: null,
                      url: /^entry2-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'index.html',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] copy-webpack-plugin and a single chunk`, function () {
    it(`should work when called without any parameters`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        plugins: [
          new CopyWebpackPlugin({
            patterns: [
              {
                from: SRC_DIR,
                to: outputDir,
              },
            ],
          }),
          new GenerateSW(),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'images/example-jpeg.jpg',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'images/web-fundamentals-icon192x192.png',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'index.html',
                    },
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
                      url: 'splitChunksEntry.js',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'styles/stylesheet-1.css',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'styles/stylesheet-2.css',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'webpackEntry.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Filtering via include/exclude`, function () {
    it(`should exclude .map and manifest.js files by default`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(9);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'manifest.json',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'not-ignored.js',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'webpackEntry.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to override the default exclude filter`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: 'manifest-normally-ignored.js',
          path: outputDir,
        },
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'manifest-normally-ignored.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to allowlist via include`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        plugins: [
          new CopyWebpackPlugin({
            patterns: [
              {
                from: SRC_DIR,
                to: outputDir,
              },
            ],
          }),
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'index.html',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'page-1.html',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'page-2.html',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should allow developers to combine the include and exclude filters`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        plugins: [
          new CopyWebpackPlugin({
            patterns: [
              {
                from: SRC_DIR,
                to: outputDir,
              },
            ],
          }),
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'page-1.html',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'page-2.html',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] swDest variations`, function () {
    it(`should work when swDest is an absolute path`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'webpackEntry.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Reporting webpack warnings`, function () {
    it(`should warn when when passed a non-existent chunk`, function (done) {
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
          expect(statsJson.warnings[0].message).to.eql(
            `The chunk 'doesNotExist' was provided in your Workbox chunks config, but was not found in the compilation.`,
          );

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should add maximumFileSizeToCacheInBytes warnings to compilation.warnings`, function (done) {
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
          new CopyWebpackPlugin({
            patterns: [
              {
                from: SRC_DIR,
                to: outputDir,
              },
            ],
          }),
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
          expect(statsJson.warnings[0].message).to.eql(
            `images/example-jpeg.jpg is 15.3 kB, and won't be precached. Configure maximumFileSizeToCacheInBytes to change this limit.`,
          );

          const swFile = upath.join(outputDir, 'service-worker.js');

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(12);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'images/web-fundamentals-icon192x192.png',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'index.html',
                    },
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
                      url: 'splitChunksEntry.js',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'styles/stylesheet-1.css',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'styles/stylesheet-2.css',
                    },
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'webpackEntry.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Customizing output paths and names`, function () {
    it(`should honor publicPath`, function (done) {
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
        plugins: [new GenerateSW()],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^\/testing\/entry1-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Filesystem options`, function () {
    it(`should support using MemoryFS as the outputFileSystem`, function (done) {
      const memoryFS = new MemoryFS();
      const outputDir = '/output/dir';
      memoryFS.mkdirpSync(outputDir);

      const config = {
        mode: 'production',
        entry: {
          entry1: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        },
        output: {
          filename: '[name]-[chunkhash].js',
          path: outputDir,
        },
        plugins: [new GenerateSW()],
      };

      const compiler = webpack(config);
      compiler.outputFileSystem = memoryFS;

      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          const files = memoryFS.readdirSync(outputDir);
          expect(files).to.have.length(3);

          const swString = memoryFS.readFileSync(
            `${outputDir}/service-worker.js`,
            'utf-8',
          );

          await validateServiceWorkerRuntime({
            swString,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^entry1-[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Multiple invocation scenarios`, function () {
    // See https://github.com/GoogleChrome/workbox/issues/2158
    it(`should support multiple compilations using the same plugin instance`, async function () {
      const outputDir = tempy.directory();
      const srcDir = upath.join(
        __dirname,
        '..',
        '..',
        'static',
        'example-project-1',
      );
      const config = {
        mode: 'production',
        entry: {
          index: upath.join(srcDir, 'webpackEntry.js'),
        },
        output: {
          filename: '[name].js',
          path: outputDir,
        },
        plugins: [new GenerateSW()],
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

              const files = await globby('**', {cwd: outputDir});
              expect(files).to.have.length(3);

              resolve();
            } catch (error) {
              reject(new Error(`Failure during compilation ${i}: ${error}`));
            }
          });
        });
      }
    });

    it(`should not list the swDest from one plugin in the other's manifest`, function (done) {
      const outputDir = tempy.directory();
      const srcDir = upath.join(
        __dirname,
        '..',
        '..',
        'static',
        'example-project-1',
      );
      const config = {
        mode: 'production',
        entry: {
          index: upath.join(srcDir, 'webpackEntry.js'),
        },
        output: {
          filename: '[name].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            swDest: 'sw1.js',
          }),
          new GenerateSW({
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile: sw1File,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'index.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          await validateServiceWorkerRuntime({
            swFile: sw2File,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: /^[0-9a-f]{32}$/,
                      url: 'index.js',
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe(`[workbox-webpack-plugin] Rollup plugin configuration options`, function () {
    it(`should support inlining the Workbox runtime`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:6].js',
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
          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support inlining the Workbox runtime and generating sourcemaps`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:6].js',
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
          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support using a swDest that includes a subdirectory`, function (done) {
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

  describe(`[workbox-webpack-plugin] Manifest transformations`, function () {
    it(`should use dontCacheBustURLsMatching`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            dontCacheBustURLsMatching: /\.[0-9a-f]{20}\./,
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      url: /^main\.[0-9a-f]{20}\.js$/,
                      revision: null,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should use modifyURLPrefix`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^https:\/\/example\.org\/main\.[0-9a-f]{20}\.js/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should use manifestTransforms`, function (done) {
      const outputDir = tempy.directory();
      const warningMessage = 'test warning';
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new GenerateSW({
            manifestTransforms: [
              (manifest, compilation) => {
                expect(manifest).to.have.lengthOf(1);
                expect(manifest[0].size).to.eql(30);
                expect(manifest[0].url.startsWith('main.')).to.be.true;
                expect(manifest[0].revision).to.be.null;
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
              },
            ],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          expect(webpackError).not.to.exist;
          const statsJson = stats.toJson();
          expect(statsJson.errors, JSON.stringify(statsJson.errors)).to.be
            .empty;
          expect(statsJson.warnings[0].message).to.eql(warningMessage);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            expectedMethodCalls: {
              importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main\.[0-9a-f]{20}\.js-suffix$/,
                    },
                  ],
                  {},
                ],
              ],
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

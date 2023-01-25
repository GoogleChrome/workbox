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

const chai = require('chai');
const chaiMatchPattern = require('chai-match-pattern');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fse = require('fs-extra');
const globby = require('globby');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const tempy = require('tempy');
const webpack = require('webpack');

const CreateWebpackAssetPlugin = require('./lib/create-webpack-asset-plugin');
const validateServiceWorkerRuntime = require('../../../../infra/testing/validator/service-worker-runtime');
const webpackBuildCheck = require('../../../../infra/testing/webpack-build-check');
const {
  InjectManifest,
} = require('../../../../packages/workbox-webpack-plugin/build/inject-manifest');

chai.use(chaiMatchPattern);
const {expect} = chai;

describe(`[workbox-webpack-plugin] InjectManifest with webpack v5`, function () {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = upath.join(
    __dirname,
    '..',
    '..',
    'static',
    'example-project-1',
  );
  const SW_SRC = upath.join(__dirname, '..', '..', 'static', 'sw-src.js');

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
          new InjectManifest({
            swSrc: SW_SRC,
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
          expect(statsJson.errors[0].message).to.eql(
            `Please check your InjectManifest plugin configuration:\n[WebpackInjectManifest] 'invalid' property is not expected to be here. Did you mean property 'include'?`,
          );

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should lead to a webpack compilation error when the swSrc contains multiple injection points`, function (done) {
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
            swSrc: upath.join(
              __dirname,
              '..',
              '..',
              'static',
              'bad-multiple-injection.js',
            ),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run((webpackError, stats) => {
        try {
          expect(webpackError).not.to.exist;
          const statsJson = stats.toJson();
          expect(statsJson.warnings).to.be.empty;
          expect(statsJson.errors[0].message).to.eql(
            `Multiple instances of self.__WB_MANIFEST were found in your SW source. Include it only once. For more info, see https://github.com/GoogleChrome/workbox/issues/2681`,
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(10);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

  describe(`[workbox-webpack-plugin] Sourcemap manipulation`, function () {
    it(`should update the sourcemap to account for manifest injection`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          const expectedSourcemap = await fse.readJSON(
            upath.join(__dirname, 'static', 'expected-service-worker.js.map'),
          );
          const actualSourcemap = await fse.readJSON(
            upath.join(outputDir, 'service-worker.js.map'),
          );

          // The mappings will vary depending on the webpack version.
          delete expectedSourcemap.mappings;
          delete actualSourcemap.mappings;

          expect(actualSourcemap).to.eql(expectedSourcemap);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

    it(`should handle a custom output.sourceMapFilename`, function (done) {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(4);

          const expectedSourcemap = await fse.readJSON(
            upath.join(__dirname, 'static', 'expected-service-worker.js.map'),
          );
          const actualSourcemap = await fse.readJSON(
            upath.join(outputDir, 'subdir', 'service-worker.js.map'),
          );

          // The mappings will vary depending on the webpack version.
          delete expectedSourcemap.mappings;
          delete actualSourcemap.mappings;

          expect(actualSourcemap).to.eql(expectedSourcemap);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

    it(`should not fail if the sourcemap is missing from the assets`, function (done) {
      const outputDir = tempy.directory();
      const swSrc = upath.join(
        __dirname,
        '..',
        '..',
        'static',
        'sw-src-missing-sourcemap.js',
      );

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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

    // See https://github.com/GoogleChrome/workbox/issues/2729
    it(`should produce valid JavaScript when eval-cheap-source-map and minimization are used`, function (done) {
      const outputDir = tempy.directory();

      const config = {
        mode: 'development',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'eval-cheap-source-map',
        optimization: {
          minimize: true,
        },
        plugins: [
          new InjectManifest({
            swSrc: upath.join(
              __dirname,
              '..',
              '..',
              'static',
              'module-import-sw.js',
            ),
            swDest: 'service-worker.js',
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
            entryPoint: 'injectManifest',
            // We can't verify expectedMethodCalls here, since we're using
            // a compiled ES module import, not the workbox-sw interfaces.
            // This test just confirms that the compilation produces valid JS.
          });

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    // See https://github.com/GoogleChrome/workbox/issues/2729
    it(`should produce valid JavaScript when eval-cheap-source-map is used without minimization`, function (done) {
      const outputDir = tempy.directory();

      const config = {
        mode: 'development',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: WEBPACK_ENTRY_FILENAME,
          path: outputDir,
        },
        devtool: 'eval-cheap-source-map',
        optimization: {
          minimize: false,
        },
        plugins: [
          new InjectManifest({
            swSrc: upath.join(
              __dirname,
              '..',
              '..',
              'static',
              'module-import-sw.js',
            ),
            swDest: 'service-worker.js',
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            // We can't verify expectedMethodCalls here, since we're using
            // a compiled ES module import, not the workbox-sw interfaces.
            // This test just confirms that the compilation produces valid JS.
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(7);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(10);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(10);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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
          expect(statsJson.warnings[0].message).to.eql(
            `The chunk 'doesNotExist' was provided in your Workbox chunks config, but was not found in the compilation.`,
          );

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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
          expect(statsJson.warnings[0].message).to.eql(
            `images/example-jpeg.jpg is 15.3 kB, and won't be precached. Configure maximumFileSizeToCacheInBytes to change this limit.`,
          );

          const swFile = upath.join(outputDir, 'service-worker.js');

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(11);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
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

    it(`should use webpackCompilationPlugins with DefinePlugin`, function (done) {
      const prefix = 'replaced-by-define-plugin';
      const swSrc = upath.join(
        __dirname,
        '..',
        '..',
        'static',
        'sw-src-define-plugin.js',
      );
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc,
            swDest: 'service-worker.js',
            webpackCompilationPlugins: [
              new webpack.DefinePlugin({
                __PREFIX__: JSON.stringify(prefix),
              }),
            ],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'service-worker.js');
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);
          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              setCacheNameDetails: [[{prefix}]],
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main\.[0-9a-f]{20}\.js$/,
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
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker.js',
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
          expect(statsJson.errors).to.be.empty;
          expect(statsJson.warnings[0].message).to.eql(warningMessage);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main.[0-9a-f]{20}\.js-suffix$/,
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

  describe(`[workbox-webpack-plugin] TypeScript compilation`, function () {
    it(`should rename a swSrc with a .ts extension to .js`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:6].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: upath.join(__dirname, '..', '..', 'static', 'sw.ts'),
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

  describe(`[workbox-webpack-plugin] Multiple invocation scenarios`, function () {
    // See https://github.com/GoogleChrome/workbox/issues/2158
    it(`should support multiple compilations using the same plugin instance`, async function () {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:6].js',
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

              const files = await globby('**', {cwd: outputDir});
              expect(files).to.have.length(2);

              resolve();
            } catch (error) {
              reject(new Error(`Failure during compilation ${i}: ${error}`));
            }
          });
        });
      }
    });

    it(`should only log once per invocation when using multiple plugin instances`, async function () {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:6].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker1.js',
          }),
          new InjectManifest({
            swSrc: SW_SRC,
            swDest: 'service-worker2.js',
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

              // There should be a single warning logged after the first compilation.
              // See https://github.com/GoogleChrome/workbox/issues/1790#issuecomment-640132556
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
  });

  describe(`[workbox-webpack-plugin] Multiple plugin instances`, function () {
    // See https://github.com/GoogleChrome/workbox/issues/2181
    it(`should not list the swDest from one plugin in the other's manifest`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            exclude: [/sw\d.js/],
            swSrc: upath.join(__dirname, '..', '..', 'static', 'sw.ts'),
            swDest: 'sw1.js',
          }),
          new InjectManifest({
            exclude: [/sw\d.js/],
            swSrc: upath.join(__dirname, '..', '..', 'static', 'sw.ts'),
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
          expect(files).to.have.length(3);

          await validateServiceWorkerRuntime({
            swFile: sw1File,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main\.[0-9a-f]{20}\.js$/,
                    },
                  ],
                  {},
                ],
              ],
            },
          });

          await validateServiceWorkerRuntime({
            swFile: sw2File,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main\.[0-9a-f]{20}\.js$/,
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

  describe(`[workbox-webpack-plugin] Manifest injection in development mode`, function () {
    it(`should produce valid, parsable JavaScript`, function (done) {
      const outputDir = tempy.directory();
      const config = {
        mode: 'development',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            exclude: [/sw\d.js/],
            swDest: 'sw.js',
            swSrc: upath.join(__dirname, '..', '..', 'static', 'sw-src.js'),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        const swFile = upath.join(outputDir, 'sw.js');

        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          await validateServiceWorkerRuntime({
            swFile: swFile,
            entryPoint: 'injectManifest',
            expectedMethodCalls: {
              precacheAndRoute: [
                [
                  [
                    {
                      revision: null,
                      url: /^main\.[0-9a-f]{20}\.js$/,
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

  describe(`[workbox-webpack-plugin] Non-compilation scenarios`, function () {
    it(`should error when compileSrc is false and webpackCompilationPlugins is used`, function (done) {
      const outputDir = tempy.directory();

      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            compileSrc: false,
            swDest: 'injected-manifest.json',
            swSrc: upath.join(
              __dirname,
              '..',
              '..',
              'static',
              'injected-manifest.json',
            ),
            webpackCompilationPlugins: [{}],
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run((webpackError, stats) => {
        try {
          expect(webpackError).not.to.exist;
          const statsJson = stats.toJson();
          expect(statsJson.errors).to.be.empty;
          expect(statsJson.warnings[0].message).to.eql(
            'compileSrc is false, so the webpackCompilationPlugins option will be ignored.',
          );

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support injecting a manifest into a JSON file`, function (done) {
      const outputDir = tempy.directory();

      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            compileSrc: false,
            swDest: 'injected-manifest.json',
            swSrc: upath.join(
              __dirname,
              '..',
              '..',
              'static',
              'injected-manifest.json',
            ),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          const manifest = await fse.readJSON(
            upath.join(outputDir, 'injected-manifest.json'),
          );
          expect(manifest).to.matchPattern([
            {
              revision: null,
              url: /^main\.[0-9a-f]{20}\.js$/,
            },
          ]);

          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it(`should support injecting a manifest into a CJS module`, function (done) {
      const outputDir = tempy.directory();

      const config = {
        mode: 'production',
        entry: upath.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name].[contenthash:20].js',
          path: outputDir,
        },
        plugins: [
          new InjectManifest({
            compileSrc: false,
            swDest: 'injected-manifest.js',
            swSrc: upath.join(
              __dirname,
              '..',
              '..',
              'static',
              'injected-manifest.js',
            ),
          }),
        ],
      };

      const compiler = webpack(config);
      compiler.run(async (webpackError, stats) => {
        try {
          webpackBuildCheck(webpackError, stats);

          const files = await globby('**', {cwd: outputDir});
          expect(files).to.have.length(2);

          const manifest = require(upath.join(
            outputDir,
            'injected-manifest.js',
          ));
          expect(manifest).to.matchPattern([
            {
              revision: null,
              url: /^main\.[0-9a-f]{20}\.js$/,
            },
          ]);

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

const CopyWebpackPlugin = require('copy-webpack-plugin');
const expect = require('chai').expect;
const fse = require('fs-extra');
const path = require('path');
const tempy = require('tempy');
const vm = require('vm');
const webpack = require('webpack');

const WorkboxWebpackPlugin = require('../../../packages/workbox-webpack-plugin/src/index');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');
const {prodOnly} = require('../../../infra/testing/env-it');

describe(`[workbox-webpack-plugin] index.js (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = path.join(__dirname, '..', 'static', 'example-project-1');
  const WORKBOX_SW_FILE_NAME = 'workbox-sw.js';
  const FILE_MANIFEST_NAME = 'file-manifest.f8e8e33d45c6284a54ce.js';

  describe(`[workbox-webpack-plugin] static assets`, function() {
    prodOnly.it(`should work when called without any parameters`, function(done) {
      const outputDir = tempy.directory();
      const config = {
        entry: path.join(SRC_DIR, WEBPACK_ENTRY_FILENAME),
        output: {
          filename: '[name]-[chunkhash].js',
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
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'workbox-sw.js.map',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'webpackEntry.js',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'images/example-jpeg.jpg',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'index.html',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'images/web-fundamentals-icon192x192.png',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'page-1.html',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'page-2.html',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'styles/stylesheet-1.css',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'styles/stylesheet-2.css',
            revision: 'f8e8e33d45c6284a54ce',
          }, {
            url: 'main-01d238afd95cf6d76eaf.js',
            revision: '01d238afd95cf6d76eaf',
          }];

          const urlToIndex = new Map(expectedEntries.map((entry, index) => {
            return [entry.url, index];
          }));

          expect(context.self.__precacheManifest).to.have.lengthOf(expectedEntries.length);
          for (const entry of context.self.__precacheManifest) {
            expect(urlToIndex.has(entry.url), entry.url).to.be.true;
            const expectedEntry = expectedEntries[urlToIndex.get(entry.url)];
            expect(entry).to.eql(expectedEntry);
          }

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

const CopyWebpackPlugin = require('copy-webpack-plugin');
const expect = require('chai').expect;
const fse = require('fs-extra');
const path = require('path');
const tempy = require('tempy');
const vm = require('vm');
const webpack = require('webpack');

const WorkboxWebpackPlugin = require('../../../packages/workbox-webpack-plugin/src/index');
const validateServiceWorkerRuntime = require('../../../infra/testing/validator/service-worker-runtime');

describe(`[workbox-webpack-plugin] index.js (End to End)`, function() {
  const WEBPACK_ENTRY_FILENAME = 'webpackEntry.js';
  const SRC_DIR = path.join(__dirname, '..', 'static', 'example-project-1');
  const WORKBOX_SW_FILE_NAME = 'workbox-sw.prod.v2.0.1.js';
  const FILE_MANIFEST_NAME = 'file-manifest.dd0ef7b6cfc3b25fd44d.js';

  describe(`[workbox-webpack-plugin] static assets`, function() {
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
            constructor: [[{}]],
            importScripts: [[
              WORKBOX_SW_FILE_NAME,
              FILE_MANIFEST_NAME,
            ]],
            precache: [[[]]],
          }});

          // Next, test the generated manifest to ensure that it contains
          // exactly the entries that we expect.
          const manifestFileContents = await fse.readFile(path.join(outputDir, FILE_MANIFEST_NAME), 'utf-8');
          const context = {self: {}};
          vm.runInNewContext(manifestFileContents, context);
          // Unfortunately, the order of entries in the generated manifest isn't
          // stable, so we can't just use chai's .eql()
          const expectedEntries = [{
            url: 'workbox-sw.prod.v2.0.1.js',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'workbox-sw.prod.v2.0.1.js.map',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'webpackEntry.js',
            revision: 'e0f630464dedebf23e31',
          }, {
            url: 'images/example-jpeg.jpg',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'index.html',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'images/web-fundamentals-icon192x192.png',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'page-1.html',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'page-2.html',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'styles/stylesheet-1.css',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }, {
            url: 'styles/stylesheet-2.css',
            revision: 'dd0ef7b6cfc3b25fd44d',
          }];
          const urlToIndex = new Map(expectedEntries.map((entry, index) => {
            return [entry.url, index];
          }));

          expect(context.self.__precacheManifest).to.have.lengthOf(expectedEntries.length);
          for (const entry of context.self.__precacheManifest) {
            expect(urlToIndex.has(entry.url)).to.be.true;
            const expectedEntry = expectedEntries[urlToIndex.get(entry.url)];
            expect(entry).to.eql(expectedEntry);
          }

          done();
        } catch (error) {
          return done(error);
        }
      });
    });
  });
});

const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const validator = require('../../../workbox-cli/test/utils/e2e-sw-validator.js');
const WorkboxWebpackPlugin = require('../../');
const testServerGen = require('../../../../utils/test-server-generator.js');
const fsExtra = require('fs-extra');

const expect = require('chai').expect;
require('chai').should();

const FILE_EXTENSIONS = ['html', 'css', 'js'];

function runWebpack(webpackConfig) {
  return new Promise((resolve, reject) => {
    let compiler = webpack(webpackConfig);
    compiler.run((err, stats)=>{
      if (err) reject(err);
      else {
        // Timeout for plugins that work on `after-emit` event of webpack
        setTimeout(()=>{
          resolve(stats);
        }, 20);
      }
    });
  });
}

/**
 * NOTE:
 * WebPack has a requirement of having an "entry" file that it will output
 * in a flat directory.
 *
 * Because of this, we are building into a build directory rather than
 * from the src directory.
 */

describe('Tests for webpack plugin', function() {
  this.timeout(120 * 1000);
  let testServer;
  let baseTestUrl;
  let tmpDirectory;

  before(() => {
    tmpDirectory = fs.mkdtempSync(path.join(__dirname, 'tmp-'));

    testServer = testServerGen();
    return testServer.start(tmpDirectory, 5050)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  afterEach(function() {
    this.timeout(10 * 1000);

    return fsExtra.remove(tmpDirectory);
  });

  // Kill the web server once all tests are complete.
  after(function() {
    this.timeout(10 * 1000);

    return testServer.stop();
  });

  it('should generate sw, when `swSrc` is not present', () => {
    fsExtra.copySync(
      path.join(__dirname, '..', '..', '..', 'workbox-cli', 'test', 'static', 'example-project-1'),
      tmpDirectory);

    process.chdir(tmpDirectory);

    const webpackConfig = {
      entry: {
        webpackEntry: path.join(tmpDirectory, 'webpackEntry.js'),
      },
      output: {
        path: tmpDirectory,
        filename: '[name].js',
      },
      plugins: [
        new WorkboxWebpackPlugin(),
      ],
    };

    return validator.performTest(()=>{
      return runWebpack(webpackConfig);
    }, {
      exampleProject: tmpDirectory,
      fileExtensions: FILE_EXTENSIONS,
      swDest: 'sw.js',
      baseTestUrl,
    });
  });

  it('should inject manifest, when `swSrc` is present', () => {
    fsExtra.copySync(
      path.join(__dirname, '..', '..', '..', 'workbox-cli', 'test', 'static', 'example-project-2'),
      tmpDirectory);

    process.chdir(tmpDirectory);

    const webpackConfig = {
      entry: {
        webpackEntry: path.join(tmpDirectory, 'webpackEntry.js'),
      },
      output: {
        path: tmpDirectory,
        filename: '[name].js',
      },
      plugins: [
        new WorkboxWebpackPlugin({
          swDest: path.join(tmpDirectory, 'sw.js'),
          swSrc: path.join(tmpDirectory, 'sw.tmpl'),
        }),
      ],
    };

    return runWebpack(webpackConfig)
    .then(() => {
      const swContents = fs.readFileSync(path.join(tmpDirectory, 'sw.js')).toString();
      const regex = new RegExp(`someVariables.precache\\(\\[
  {
    "url": "/index.html",
    "revision": "\\w*"
  },
  {
    "url": "/page-1.html",
    "revision": "\\w*"
  },
  {
    "url": "/page-2.html",
    "revision": "\\w*"
  },
  {
    "url": "/styles/stylesheet-1.css",
    "revision": "\\w*"
  },
  {
    "url": "/styles/stylesheet-2.css",
    "revision": "\\w*"
  }
\\]\\);`);
      const result = regex.exec(swContents);
      expect(result).to.exist;
    });
  });
});

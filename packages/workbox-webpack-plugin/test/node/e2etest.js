/* global workbox, expect, describe */
const assert = require('chai').assert;
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const validator = require('../../../workbox-cli/test/utils/e2e-sw-validator.js');
const WorkboxWebpackPlugin = require('../../');
const mkdirp = require('mkdirp');
const testServerGen = require('../../../../utils/test-server-generator.js');
const fsExtra = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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

describe('Tests for webpack plugin', function() {
  this.timeout(120 * 1000);
  let testServer;
  let baseTestUrl;
  const workingDir = path.join(__dirname, 'tmp-webpack-assets');

  before(() => {
    testServer = testServerGen();
    return testServer.start(workingDir, 5050)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  // Kill the web server once all tests are complete.
  after(function() {
    this.timeout(10 * 1000);

    return testServer.stop()
      .then(() => fsExtra.remove(workingDir));
  });

  beforeEach((done)=>{
    mkdirp(workingDir, () => {
      fs.writeFileSync(path.join(workingDir, 'src.js'), '(function(){})()');
      fs.writeFileSync(path.join(workingDir, 'sourceSw.js'),
        'importScripts(\'https://www.gstatic.com/firebasejs/3.6.9/firebase-app.js\');'
        + '\n importScripts(\'workbox-sw.prod.v1.0.0.js\');'
        + '\n const workboxSW = new self.WorkboxSW();'
        + '\n workboxSW.precache([]);'
      );
      done();
    });
  });

  afterEach(() => {
    fs.readdir(workingDir, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(workingDir, file), (err) => {
          if (err) throw err;
        });
      }
    });
  });

  it('should generate sw, when `swSrc` is not present', () => {
    const webpackConfig = {
      entry: {
        swApp: path.join(__dirname, 'tmp-webpack-assets/src.js'),
      },
      output: {
        path: path.join(__dirname, '/tmp-webpack-assets/'),
        filename: '[name].js',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new WorkboxWebpackPlugin(),
      ],
    };
    return validator.performTest(()=>{
      return runWebpack(webpackConfig);
    }, {
      exampleProject: workingDir,
      fileExtensions: ['html', 'js'],
      swDest: path.join(__dirname, 'tmp-webpack-assets/sw.js'),
      baseTestUrl,
    });
  });

  it('should inject manifest, when `swSrc` is present', () => {
    const webpackConfig = {
      entry: {
        swApp: path.join(__dirname, 'tmp-webpack-assets/src.js'),
      },
      output: {
        path: path.join(__dirname, '/tmp-webpack-assets/'),
        filename: '[name].js',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new WorkboxWebpackPlugin({
          swDest: path.join(__dirname, 'tmp-webpack-assets/swGenerated.js'),
          swSrc: path.join(__dirname, 'tmp-webpack-assets/sourceSw.js'),
          globIgnores: ['swGenerated.js'],
        }),
      ],
    };
    return validator.performTest(()=>{
      return runWebpack(webpackConfig);
    }, {
      exampleProject: workingDir,
      fileExtensions: ['html', 'js'],
      swDest: path.join(__dirname, 'tmp-webpack-assets/swGenerated.js'),
      baseTestUrl,
    }).then(()=>{
      const swContents = fs.readFileSync(path.join(__dirname, 'tmp-webpack-assets/swGenerated.js'));

      assert.isTrue(swContents.indexOf(
        'importScripts(\'https://www.gstatic.com/firebasejs/3.6.9/firebase-app.js\');'
      ) !== -1);
    });
  });
});

/* global workbox, expect, describe */
const assert = require('chai').assert;
const WorkboxBuild = require('../../../workbox-build/src');
const proxyquire = require('proxyquire');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

let WorkboxWebpackPlugin;

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
  this.timeout(55000);
  beforeEach(()=>{
    // do a proxy require
    WorkboxWebpackPlugin = proxyquire('../../', {
      'workbox-build': WorkboxBuild,
    });
    new WorkboxWebpackPlugin();
  });

  it('should generate sw, when `swSrc` is not present', () => {
    this.timeout(35000);
    const webpackConfig = {
      entry: path.join(__dirname, 'webpack-assets/src.js'),
      output: {
        path: path.join(__dirname, '/webpack-assets/'),
        filename: '[name].js',
      },
      plugins: [
        new WorkboxWebpackPlugin(),
      ],
    };
    return runWebpack(webpackConfig)
    .then(()=>{
      const swContents = fs.readFileSync(path.join(__dirname, 'webpack-assets/sw.js'));
      assert.isTrue(swContents.indexOf('workboxSW.precache(fileManifest)') !== -1);
    });
  });

  it('should inject manifest, when `swSrc` is present', () => {
    this.timeout(35000);
    const webpackConfig = {
      entry: {
        swApp: path.join(__dirname, 'webpack-assets/src.js'),
      },
      output: {
        path: path.join(__dirname, '/webpack-assets/'),
        filename: '[name].js',
      },
      plugins: [
        new WorkboxWebpackPlugin({
          swDest: path.join(__dirname, 'webpack-assets/swGenerated.js'),
          swSrc: path.join(__dirname, 'webpack-assets/sourceSw.js'),
        }),
      ],
    };
    return runWebpack(webpackConfig)
    .then(()=>{
      const swContents = fs.readFileSync(path.join(__dirname, 'webpack-assets/swGenerated.js'));
      assert.isTrue(swContents.indexOf('workboxSW.precache([') !== -1);
      assert.isTrue(swContents.indexOf('workboxSW.precache([])') === -1);
      assert.isTrue(swContents.indexOf(
        'importScripts(\'https://www.gstatic.com/firebasejs/3.6.9/firebase-app.js\');'
      ) !== -1);
    });
  });
});

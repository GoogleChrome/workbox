const proxyquire = require('proxyquire');
const sinon = require('sinon');
const path = require('path');
const assert = require('chai').assert;

const OUTPUT_DIR = path.join(__dirname, 'dist');
const DEFAULT_GLOB_PATTERNS = ['**/*.{html,js,css}'];
const WEBPACK_EVENT_NAME = 'after-emit';

describe(`Tests for webpack plugin`, function() {
  let proxySwBuild;
  let webpackEventCallback;
  let webpackDoneCallback;
  let webpackCompilation;

  beforeEach(() => {
    setupProxyForSwBuild();
    setupMockForWebpack();
  });

  function setupProxyForSwBuild() {
    proxySwBuild = {
      injectManifest: function() {},
      generateSW: function() {},
      generateFileManifest: function() {},
    };

    sinon.stub(proxySwBuild, 'generateSW').callsFake(function() {
      return new Promise((resolve) => {
        resolve();
      });
    });

    sinon.stub(proxySwBuild, 'injectManifest').callsFake(function() {
      return new Promise((resolve) => {
        resolve();
      });
    });

    sinon.stub(proxySwBuild, 'generateFileManifest').callsFake(function() {
      return new Promise((resolve) => {
        resolve();
      });
    });
  }

  function setupMockForWebpack() {
    webpackCompilation = {
      compiler: {
        plugin: function() {},
      },
      mainTemplate: {
        getPublicPath: function() {},
      },
    };

    webpackDoneCallback = sinon.spy();

    // Create webpack callback handler
    sinon.stub(webpackCompilation.compiler, 'plugin').callsFake((event, callback) => {
      webpackEventCallback = callback;
    });

    webpackCompilation.options = {
      output: {
        path: OUTPUT_DIR,
      },
    };
  }

  describe('BasePlugin', () => {
    let BasePlugin;

    beforeEach(function() {
      // do a proxy require
      BasePlugin = require('../../src/lib/base-plugin');
    });

    it(`should not mutate the user-given config object (referential safety)`, () => {
      const config = {};
      const basePlugin = new BasePlugin(config);
      assert.notStrictEqual(
        basePlugin.getConfig(webpackCompilation),
        config,
      );
      assert.deepEqual(
        config,
        {},
      );
    });

    it(`should assign the default value to globDirectory`, () => {
      const basePlugin = new BasePlugin({});
      assert.strictEqual(
        basePlugin.getConfig(webpackCompilation).globDirectory,
        OUTPUT_DIR,
      );
    });

    it(`should keep user-given value for config.globDirectory`, () => {
      const basePlugin = new BasePlugin({
        globDirectory: 'foo',
      });
      assert.strictEqual(
        basePlugin.getConfig(webpackCompilation).globDirectory,
        'foo',
      );
    });

    it(`should assign the default value to globPatterns`, () => {
      const basePlugin = new BasePlugin({});
      assert.deepEqual(
        basePlugin.getConfig(webpackCompilation).globPatterns,
        DEFAULT_GLOB_PATTERNS,
      );
    });

    it(`should keep user-given value for config.globPatterns`, () => {
      const testGlobs = ['**/*.{js,css}'];
      const plugin = new BasePlugin({
        globPatterns: testGlobs,
      });
      assert.strictEqual(
        plugin.getConfig(webpackCompilation).globPatterns,
        testGlobs,
      );
    });

    it(`should use subscribe to webpack's after-emit event`, () => {
      const plugin = new BasePlugin({});
      plugin.apply(webpackCompilation.compiler);
      // Plugin is being called once
      assert.isTrue(webpackCompilation.compiler.plugin.calledOnce);
      // Plugin is working on correct event
      assert.equal(
        webpackCompilation.compiler.plugin.getCall(0).args[0],
        WEBPACK_EVENT_NAME
      );
    });
  });

  describe('GenerateSWPlugin', () => {
    let GenerateSWPlugin;

    beforeEach(function() {
      // do a proxy require
      GenerateSWPlugin = proxyquire('../../src/lib/generate-sw', {
        'workbox-build': proxySwBuild,
      });
    });

    it(`should assign the default value for config.swDest`, () => {
      const plugin = new GenerateSWPlugin({});
      assert.equal(
        plugin.getConfig(webpackCompilation).swDest,
        `${OUTPUT_DIR}/sw.js`
      );
    });

    it(`should keep user-given value for config.swDest `, () => {
      const plugin = new GenerateSWPlugin({
        swDest: 'foo.js',
      });
      assert.equal(
        plugin.getConfig(webpackCompilation).swDest,
        'foo.js',
      );
    });

    it(`should call generateSW with proper config`, () => {
      const userConfig = {
        skipWaiting: true,
      };
      const plugin = new GenerateSWPlugin(userConfig);
      plugin.apply(webpackCompilation.compiler);

      webpackEventCallback(webpackCompilation, webpackDoneCallback);
      assert.isTrue(proxySwBuild.generateSW.calledOnce);
      assert.deepEqual(
        proxySwBuild.generateSW.getCall(0).args,
        [Object.assign({
          globDirectory: OUTPUT_DIR,
          globPatterns: DEFAULT_GLOB_PATTERNS,
          swDest: `${OUTPUT_DIR}/sw.js`,
        }, userConfig)],
      );
    });
  });

  describe('GenerateFileManifestPlugin', () => {
    let GenerateFileManifestPlugin;

    beforeEach(function() {
      // do a proxy require
      GenerateFileManifestPlugin = proxyquire(
        '../../src/lib/generate-file-manifest',
        {
          'workbox-build': proxySwBuild,
        }
      );
    });

    it(`should assign the default value for config.manifestDest`, () => {
      const plugin = new GenerateFileManifestPlugin({});
      assert.equal(
        plugin.getConfig(webpackCompilation).manifestDest,
        `${OUTPUT_DIR}/precache-manifest.js`
      );
    });

    it(`should keep user-given value for config.manifestDest `, () => {
      const plugin = new GenerateFileManifestPlugin({
        manifestDest: 'foo.js',
      });
      assert.equal(
        plugin.getConfig(webpackCompilation).manifestDest,
        'foo.js',
      );
    });

    it(`should call generateFileManifest with proper config`, () => {
      const userConfig = {
        maximumFileSizeToCacheInBytes: 1024,
      };
      const plugin = new GenerateFileManifestPlugin(userConfig);
      plugin.apply(webpackCompilation.compiler);
      webpackEventCallback(webpackCompilation, webpackDoneCallback);

      assert.isTrue(proxySwBuild.generateFileManifest.calledOnce);
      assert.deepEqual(
        proxySwBuild.generateFileManifest.getCall(0).args,
        [Object.assign({
          globDirectory: OUTPUT_DIR,
          globPatterns: DEFAULT_GLOB_PATTERNS,
          manifestDest: `${OUTPUT_DIR}/precache-manifest.js`,
        }, userConfig)],
      );
    });
  });

  describe('InjectManifestPlugin', () => {
    let InjectManifestPlugin;

    beforeEach(function() {
      // do a proxy require
      InjectManifestPlugin = proxyquire(
        '../../src/lib/inject-manifest',
        {
          'workbox-build': proxySwBuild,
        }
      );
    });

    it(`should throw if config.swSrc is falsy`, () => {
      assert.throws(() => new InjectManifestPlugin({}).getConfig(webpackCompilation));
    });

    it(`should keep user-given value for config.swSrc `, () => {
      const plugin = new InjectManifestPlugin({
        swSrc: 'foo.js',
      });
      assert.equal(
        plugin.getConfig(webpackCompilation).swSrc,
        'foo.js',
      );
    });

    it(`should assign the default value for config.swDest`, () => {
      const plugin = new InjectManifestPlugin({
        swSrc: 'foo.js',
      });
      assert.equal(
        plugin.getConfig(webpackCompilation).swDest,
        `${OUTPUT_DIR}/sw.js`
      );
    });

    it(`should keep user-given value for config.swDest `, () => {
      const plugin = new InjectManifestPlugin({
        swSrc: 'foo.js',
        swDest: 'bar.js',
      });
      assert.equal(
        plugin.getConfig(webpackCompilation).swDest,
        'bar.js',
      );
    });

    it(`should call injectManifest with proper config`, () => {
      const userConfig = {
        swSrc: 'foo.js',
        modifyUrlPrefix: 'bar',
      };
      const plugin = new InjectManifestPlugin(userConfig);
      plugin.apply(webpackCompilation.compiler);
      webpackEventCallback(webpackCompilation, webpackDoneCallback);

      assert.isTrue(proxySwBuild.injectManifest.calledOnce);
      assert.deepEqual(
        proxySwBuild.injectManifest.getCall(0).args,
        [Object.assign({
          globDirectory: OUTPUT_DIR,
          globPatterns: DEFAULT_GLOB_PATTERNS,
          swDest: `${OUTPUT_DIR}/sw.js`,
        }, userConfig)],
      );
    });
  });
});

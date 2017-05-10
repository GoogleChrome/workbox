const proxyquire = require('proxyquire');
const sinon = require('sinon');
const path = require('path');
const assert = require('chai').assert;
const OUTPUT_DIR = path.join(__dirname, 'dist');
const WEBPACK_EVENT_NAME = 'after-emit';

// Proxies and stubs
let proxySwBuild;
let SwWebpackPlugin;

// Stubby object for webpack
const webpackCompilation = {
	compiler: {
		plugin: function() {},
	},
	mainTemplate: {
		getPublicPath: function() {},
	},
};

let webpackEventCallback;
const webpackDoneCallback = sinon.spy();
// Create webpack callback handler
sinon.stub(webpackCompilation.compiler, 'plugin', (event, callback)=> {
	webpackEventCallback = callback;
});

webpackCompilation.options={
	output: {
		path: OUTPUT_DIR,
	},
};

describe('Tests for webpack plugin', function() {
	beforeEach(()=>{
		// Build a proxy sw-build
		proxySwBuild = {
			injectManifest: function() {},
			generateSW: function() {},
		};

		// Generate stub methods
		sinon.stub(proxySwBuild, 'generateSW', function() {
			return new Promise((resolve) => {
				resolve();
			});
		});

		sinon.stub(proxySwBuild, 'injectManifest', function() {
			return new Promise((resolve) => {
				resolve();
			});
		});

		// do a proxy require
		SwWebpackPlugin = proxyquire('../../', {
			'sw-build': proxySwBuild,
		});
	});

	it('should mutate config accordin to webpack defaults', () => {
		let swWebpackPlugin = new SwWebpackPlugin({});
		assert.equal(swWebpackPlugin.getConfig(webpackCompilation).rootDirectory,
			OUTPUT_DIR);
		const CUSTOM_ROOT_DIRECTORY = '/public';
		swWebpackPlugin = new SwWebpackPlugin({
			rootDirectory: CUSTOM_ROOT_DIRECTORY,
		});
		assert.equal(swWebpackPlugin.getConfig(webpackCompilation).rootDirectory,
			CUSTOM_ROOT_DIRECTORY);
	});

	it('should call generateSw when swSrc is not given', () => {
		let swWebpackPlugin = new SwWebpackPlugin({});
		swWebpackPlugin.apply(webpackCompilation.compiler);
		// Plugin is being called once
		assert.isTrue(webpackCompilation.compiler.plugin.calledOnce);
		// Plugin is working on correct event
		assert.equal(webpackCompilation.compiler.plugin.getCall(0).args[0],
			WEBPACK_EVENT_NAME);
		// Call the callback and then check
		// which function is being called based on config
		webpackEventCallback(webpackCompilation, webpackDoneCallback);
		assert.isTrue(proxySwBuild.generateSW.calledOnce);
		assert.isTrue(proxySwBuild.injectManifest.notCalled);
	});

	it('should call injectManifest when swSrc is given', () => {
		let swWebpackPlugin = new SwWebpackPlugin({
			swSrc: './sw.js',
		});
		swWebpackPlugin.apply(webpackCompilation.compiler);
		// Plugin is being called once
		assert.isTrue(webpackCompilation.compiler.plugin.calledTwice);
		// Plugin is working on correct event
		assert.equal(webpackCompilation.compiler.plugin.getCall(0).args[0],
			WEBPACK_EVENT_NAME);
		// Call the callback and then check
		// which function is being called based on config
		webpackEventCallback(webpackCompilation, webpackDoneCallback);
		assert.isTrue(proxySwBuild.generateSW.notCalled);
		assert.isTrue(proxySwBuild.injectManifest.calledOnce);
	});
});

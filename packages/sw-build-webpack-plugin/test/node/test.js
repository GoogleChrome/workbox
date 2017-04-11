const proxyquire = require('proxyquire');
const sinon = require('sinon');
const path = require('path');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const assert = require('chai').assert;

const SwWebpackPlugin = proxyquire('../../', {
	'../sw-build/src/': {},
});

describe('Tests for webpack plugin', function() {
	it('should mutate config accordin to webpack defaults', () => {
		const webpackCompilation = {
			mainTemplate: {
				getPublicPath: function() {},
			},
		};
		sinon.stub(webpackCompilation.mainTemplate, 'getPublicPath', ()=>{
			return OUTPUT_DIR;
		});
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

	it('should call appropriate function based on cofig', () => {

	});
});

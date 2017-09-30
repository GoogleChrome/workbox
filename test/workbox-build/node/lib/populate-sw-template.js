const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`lib/populate-sw-template.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/populate-sw-template';

  it(`should throw an error if templating fails`, function() {
    const populateSWTemplate = proxyquire(MODULE_PATH, {
      'lodash.template': () => {
        throw new Error();
      },
    });

    try {
      populateSWTemplate({});
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['populating-sw-tmpl-failed']);
    }
  });

  it(`should pass the expected options to the template using mostly defaults`, function() {
    const runtimeCachingPlaceholder = 'runtime-caching-placeholder';
    const swTemplate = 'template';
    const workboxOptionsString = '{}';

    const innerStub = sinon.stub().returns('');
    const outerStub = sinon.stub().returns(innerStub);
    const populateSWTemplate = proxyquire(MODULE_PATH, {
      'lodash.template': outerStub,
      './runtime-caching-converter': () => runtimeCachingPlaceholder,
    });

    populateSWTemplate({
      swTemplate,
    });

    expect(outerStub.alwaysCalledWith(swTemplate)).to.be.true;
    expect(innerStub.alwaysCalledWith({
      importScripts: undefined,
      manifestEntries: undefined,
      navigateFallback: undefined,
      navigateFallbackWhitelist: undefined,
      runtimeCaching: runtimeCachingPlaceholder,
      workboxOptionsString,
    })).to.be.true;
  });

  it(`should pass the expected options to the template`, function() {
    const cacheId = 'test-cache-id';
    const clientsClaim = true;
    const directoryIndex = 'index.html';
    const handleFetch = true;
    const ignoreUrlParametersMatching = [/a/, /b/];
    const importScripts = ['test.js'];
    const manifestEntries = [{url: '/path/to/index.html', revision: '1234'}];
    const navigateFallback = '/shell.html';
    const navigateFallbackWhitelist = [/test/];
    const runtimeCaching = [];
    const runtimeCachingPlaceholder = 'runtime-caching-placeholder';
    const skipWaiting = true;
    const swTemplate = 'template';
    const workboxOptionsString = '{\n  "cacheId": "test-cache-id",\n  "skipWaiting": true,\n  "handleFetch": true,\n  "clientsClaim": true,\n  "directoryIndex": "index.html",\n  "ignoreUrlParametersMatching": [/a/, /b/]\n}';

    const innerStub = sinon.stub().returns('');
    const outerStub = sinon.stub().returns(innerStub);
    const populateSWTemplate = proxyquire(MODULE_PATH, {
      'lodash.template': outerStub,
      './runtime-caching-converter': () => runtimeCachingPlaceholder,
    });

    populateSWTemplate({
      cacheId,
      clientsClaim,
      directoryIndex,
      handleFetch,
      ignoreUrlParametersMatching,
      importScripts,
      manifestEntries,
      navigateFallback,
      navigateFallbackWhitelist,
      runtimeCaching,
      skipWaiting,
      swTemplate,
    });

    expect(outerStub.alwaysCalledWith(swTemplate)).to.be.true;
    expect(innerStub.alwaysCalledWith({
      importScripts,
      manifestEntries,
      navigateFallback,
      navigateFallbackWhitelist,
      runtimeCaching: runtimeCachingPlaceholder,
      workboxOptionsString,
    })).to.be.true;
  });
});

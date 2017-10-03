const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] lib/populate-sw-template.js`, function() {
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
      '../templates/sw-template': swTemplate,
    });

    populateSWTemplate({});

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

    // There are two stages in templating: creating the active template function
    // from an initial string, and passing variables to that template function
    // to get back a final, populated template string.
    // We need to stub out both of those steps to test the full flow.
    const templatePopulationStub = sinon.stub().returns('');
    const templateCreationStub = sinon.stub().returns(templatePopulationStub);
    const populateSWTemplate = proxyquire(MODULE_PATH, {
      'lodash.template': templateCreationStub,
      './runtime-caching-converter': () => runtimeCachingPlaceholder,
      '../templates/sw-template': swTemplate,
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
    });

    expect(templateCreationStub.alwaysCalledWith(swTemplate)).to.be.true;
    expect(templatePopulationStub.alwaysCalledWith({
      importScripts,
      manifestEntries,
      navigateFallback,
      navigateFallbackWhitelist,
      runtimeCaching: runtimeCachingPlaceholder,
      workboxOptionsString,
    })).to.be.true;
  });
});

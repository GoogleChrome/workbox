/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');

describe(`[workbox-build] lib/populate-sw-template.js`, function () {
  const MODULE_PATH =
    '../../../../packages/workbox-build/build/lib/populate-sw-template';

  it(`should throw an error if templating fails`, function () {
    const manifestEntries = ['ignored'];

    const {populateSWTemplate} = proxyquire(MODULE_PATH, {
      '../templates/sw-template': {
        useSwTemplate: () => {
          throw new Error();
        },
      },
    });

    try {
      populateSWTemplate({manifestEntries});
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['populating-sw-tmpl-failed']);
    }
  });

  it(`should throw an error if both manifestEntries and runtimeCaching are empty`, function () {
    const {populateSWTemplate} = proxyquire(MODULE_PATH, {
      '../templates/sw-template': {
        useSwTemplate: () => '',
      },
    });

    try {
      populateSWTemplate({manifestEntries: [], runtimeCaching: []});
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(
        errors['no-manifest-entries-or-runtime-caching'],
      );
    }
  });

  it(`should pass the expected options to the template using mostly defaults`, function () {
    const runtimeCachingPlaceholder = 'runtime-caching-placeholder';
    const precacheOptionsString = '{}';
    const manifestEntries = ['ignored'];

    const useSwTemplateStub = sinon.stub().returns('');
    const {populateSWTemplate} = proxyquire(MODULE_PATH, {
      './runtime-caching-converter': {
        runtimeCachingConverter: () => runtimeCachingPlaceholder,
      },
      '../templates/sw-template': {useSwTemplate: useSwTemplateStub},
    });

    populateSWTemplate({manifestEntries});

    // Doing a strict comparison with functions isn't easy.
    expect(useSwTemplateStub.args[0][0].use).to.be.a('function');
    delete useSwTemplateStub.args[0][0].use;

    expect(useSwTemplateStub.args[0]).to.eql([
      {
        manifestEntries,
        cacheId: undefined,
        cleanupOutdatedCaches: undefined,
        clientsClaim: undefined,
        disableDevLogs: undefined,
        importScripts: undefined,
        navigateFallback: undefined,
        navigateFallbackDenylist: undefined,
        navigateFallbackAllowlist: undefined,
        navigationPreload: undefined,
        offlineAnalyticsConfigString: undefined,
        precacheOptionsString,
        runtimeCaching: runtimeCachingPlaceholder,
        skipWaiting: undefined,
      },
    ]);
  });

  it(`should pass the expected options to the template`, function () {
    const cacheId = 'test-cache-id';
    const cleanupOutdatedCaches = true;
    const clientsClaim = true;
    const directoryIndex = 'index.html';
    const disableDevLogs = true;
    const handleFetch = true;
    const ignoreURLParametersMatching = [/a/, /b/];
    const importScripts = ['test.js'];
    const manifestEntries = [{url: '/path/to/index.html', revision: '1234'}];
    const navigateFallback = '/shell.html';
    const navigateFallbackDenylist = [/another-test/];
    const navigateFallbackAllowlist = [/test/];
    const navigationPreload = true;
    const offlineGoogleAnalytics = true;
    const offlineAnalyticsConfigString = '{}';
    const runtimeCaching = [];
    const runtimeCachingPlaceholder = 'runtime-caching-placeholder';
    const skipWaiting = true;
    const precacheOptionsString =
      '{\n  "directoryIndex": "index.html",\n  "ignoreURLParametersMatching": [/a/, /b/]\n}';

    // There are two stages in templating: creating the active template function
    // from an initial string, and passing variables to that template function
    // to get back a final, populated template string.
    // We need to stub out both of those steps to test the full flow.
    const useSwTemplateStub = sinon.stub().returns('');
    const {populateSWTemplate} = proxyquire(MODULE_PATH, {
      './runtime-caching-converter': {
        runtimeCachingConverter: () => runtimeCachingPlaceholder,
      },
      '../templates/sw-template': {useSwTemplate: useSwTemplateStub},
    });

    populateSWTemplate({
      cacheId,
      cleanupOutdatedCaches,
      clientsClaim,
      directoryIndex,
      disableDevLogs,
      handleFetch,
      ignoreURLParametersMatching,
      importScripts,
      manifestEntries,
      navigateFallback,
      navigateFallbackDenylist,
      navigateFallbackAllowlist,
      navigationPreload,
      offlineGoogleAnalytics,
      runtimeCaching,
      skipWaiting,
    });

    // Doing a strict comparison with functions isn't easy.
    expect(useSwTemplateStub.args[0][0].use).to.be.a('function');
    delete useSwTemplateStub.args[0][0].use;

    expect(useSwTemplateStub.args[0]).to.eql([
      {
        cacheId,
        cleanupOutdatedCaches,
        clientsClaim,
        disableDevLogs,
        importScripts,
        manifestEntries,
        navigateFallback,
        navigateFallbackDenylist,
        navigateFallbackAllowlist,
        navigationPreload,
        offlineAnalyticsConfigString,
        runtimeCaching: runtimeCachingPlaceholder,
        precacheOptionsString,
        skipWaiting,
      },
    ]);
  });

  it(`should handle a complex offlineGoogleAnalytics value when populating the template`, function () {
    const runtimeCachingPlaceholder = 'runtime-caching-placeholder';
    const precacheOptionsString = '{}';
    const offlineGoogleAnalytics = {
      parameterOverrides: {
        cd1: 'offline',
      },
      hitFilter: (params) => {
        // Comments are stripped.
        params.set('cm1', params.get('qt'));
      },
    };
    const offlineAnalyticsConfigString = `{\n\tparameterOverrides: {\n\t\tcd1: 'offline'\n\t},\n\thitFilter: (params) => {\n        \n        params.set('cm1', params.get('qt'));\n      }\n}`;
    const manifestEntries = ['ignored'];

    const useSwTemplateStub = sinon.stub().returns('');
    const {populateSWTemplate} = proxyquire(MODULE_PATH, {
      './runtime-caching-converter': {
        runtimeCachingConverter: () => runtimeCachingPlaceholder,
      },
      '../templates/sw-template': {useSwTemplate: useSwTemplateStub},
    });

    populateSWTemplate({manifestEntries, offlineGoogleAnalytics});

    // Doing a strict comparison with functions isn't easy.
    expect(useSwTemplateStub.args[0][0].use).to.be.a('function');
    delete useSwTemplateStub.args[0][0].use;

    expect(useSwTemplateStub.args[0]).to.eql([
      {
        manifestEntries,
        cacheId: undefined,
        cleanupOutdatedCaches: undefined,
        clientsClaim: undefined,
        disableDevLogs: undefined,
        importScripts: undefined,
        navigateFallback: undefined,
        navigateFallbackDenylist: undefined,
        navigateFallbackAllowlist: undefined,
        navigationPreload: undefined,
        offlineAnalyticsConfigString,
        precacheOptionsString,
        runtimeCaching: runtimeCachingPlaceholder,
        skipWaiting: undefined,
      },
    ]);
  });
});

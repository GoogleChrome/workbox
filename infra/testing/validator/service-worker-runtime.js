/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const assert = require('assert');
const chai = require('chai');
const chaiMatchPattern = require('chai-match-pattern');
const fse = require('fs-extra');
const makeServiceWorkerEnv = require('service-worker-mock');
const sinon = require('sinon');
const vm = require('vm');

chai.use(chaiMatchPattern);
const {expect} = chai;

// See https://github.com/chaijs/chai/issues/697
function stringifyFunctionsInArray(arr) {
  return arr.map((item) =>
    typeof item === 'function' ? item.toString() : item,
  );
}

function setupSpiesAndContextForInjectManifest() {
  const cacheableResponsePluginSpy = sinon.spy();
  class CacheableResponsePlugin {
    constructor(...args) {
      cacheableResponsePluginSpy(...args);
    }
  }

  const cacheExpirationPluginSpy = sinon.spy();
  class CacheExpirationPlugin {
    constructor(...args) {
      cacheExpirationPluginSpy(...args);
    }
  }

  const importScripts = sinon.spy();

  const addEventListener = sinon.stub();

  const workbox = {
    cacheableResponse: {
      CacheableResponsePlugin: CacheableResponsePlugin,
    },
    expiration: {
      CacheExpirationPlugin: CacheExpirationPlugin,
    },
    googleAnalytics: {
      initialize: sinon.spy(),
    },
    precaching: {
      // To make testing easier, hardcode this fake URL return value.
      getCacheKeyForURL: sinon.stub().returns('/urlWithCacheKey'),
      precacheAndRoute: sinon.spy(),
      cleanupOutdatedCaches: sinon.spy(),
    },
    navigationPreload: {
      enable: sinon.spy(),
    },
    routing: {
      registerNavigationRoute: sinon.spy(),
      registerRoute: sinon.spy(),
    },
    core: {
      clientsClaim: sinon.spy(),
      setCacheNameDetails: sinon.spy(),
    },
    setConfig: sinon.spy(),
    // To make testing easier, return the name of the strategy.
    strategies: {
      CacheFirst: sinon.stub().returns({name: 'CacheFirst'}),
      NetworkFirst: sinon.stub().returns({name: 'NetworkFirst'}),
    },
  };

  const context = Object.assign(
    {
      importScripts,
      workbox,
    },
    makeServiceWorkerEnv(),
  );
  context.self.addEventListener = addEventListener;
  context.self.skipWaiting = sinon.spy();

  const methodsToSpies = {
    importScripts,
    cacheableResponsePlugin: cacheableResponsePluginSpy,
    cleanupOutdatedCaches: workbox.precaching.cleanupOutdatedCaches,
    cacheExpirationPlugin: cacheExpirationPluginSpy,
    CacheFirst: workbox.strategies.CacheFirst,
    clientsClaim: workbox.core.clientsClaim,
    getCacheKeyForURL: workbox.precaching.getCacheKeyForURL,
    googleAnalyticsInitialize: workbox.googleAnalytics.initialize,
    NetworkFirst: workbox.strategies.NetworkFirst,
    navigationPreloadEnable: workbox.navigationPreload.enable,
    precacheAndRoute: workbox.precaching.precacheAndRoute,
    registerNavigationRoute: workbox.routing.registerNavigationRoute,
    registerRoute: workbox.routing.registerRoute,
    setCacheNameDetails: workbox.core.setCacheNameDetails,
    setConfig: workbox.setConfig,
    skipWaiting: context.self.skipWaiting,
  };

  return {addEventListener, context, methodsToSpies};
}

function setupSpiesAndContextForGenerateSW() {
  const addEventListener = sinon.spy();
  const importScripts = sinon.spy();

  const workboxContext = {
    importScripts,
    CacheFirst: sinon.stub().returns({name: 'CacheFirst'}),
    clientsClaim: sinon.spy(),
    createHandlerBoundToURL: sinon.stub().returns('/urlWithCacheKey'),
    enable: sinon.spy(),
    initialize: sinon.spy(),
    NavigationRoute: sinon.stub().returns({name: 'NavigationRoute'}),
    NetworkFirst: sinon.stub().returns({name: 'NetworkFirst'}),
    BroadcastUpdatePlugin: sinon.spy(),
    CacheableResponsePlugin: sinon.spy(),
    ExpirationPlugin: sinon.spy(),
    PrecacheFallbackPlugin: sinon.spy(),
    precacheAndRoute: sinon.spy(),
    registerRoute: sinon.spy(),
    setCacheNameDetails: sinon.spy(),
    skipWaiting: sinon.spy(),
  };

  const context = Object.assign(
    {
      importScripts,
      define: (scripts, callback) => {
        importScripts(...scripts);
        callback(workboxContext);
      },
    },
    makeServiceWorkerEnv(),
  );
  context.self.addEventListener = addEventListener;
  context.self.skipWaiting = workboxContext.skipWaiting;

  return {addEventListener, context, methodsToSpies: workboxContext};
}

function validateMethodCalls({methodsToSpies, expectedMethodCalls, context}) {
  for (const [method, spy] of Object.entries(methodsToSpies)) {
    if (spy.called) {
      const args = spy.args.map((arg) =>
        Array.isArray(arg) ? stringifyFunctionsInArray(arg) : arg,
      );

      expect(args, `while testing method calls for ${method}`).to.matchPattern(
        expectedMethodCalls[method],
      );
    } else {
      expect(
        expectedMethodCalls[method],
        `while testing method calls for ${method}`,
      ).to.be.undefined;
    }
  }

  // Special validation for __WB_DISABLE_DEV_LOGS, which is a boolean
  // assignment, so we can't stub it out.
  if ('__WB_DISABLE_DEV_LOGS' in expectedMethodCalls) {
    expect(context.self.__WB_DISABLE_DEV_LOGS).to.eql(
      expectedMethodCalls.__WB_DISABLE_DEV_LOGS,
      `__WB_DISABLE_DEV_LOGS`,
    );
  }
}

/**
 * This is used in the service worker generation tests to validate core
 * service worker functionality. While we don't fully emulate a real service
 * worker runtime, we set up spies/stubs to listen for certain method calls,
 * run the code in a VM sandbox, and then verify that the service worker
 * made the expected method calls.
 *
 * If any of the expected method calls + parameter combinations were not made,
 * this method will reject with a description of what failed.
 *
 * @param {string} [swFile]
 * @param {string} [swString]
 * @param {Object} expectedMethodCalls
 * @return {Promise} Resolves if all of the expected method calls were made.
 */
module.exports = async ({
  addEventListenerValidation,
  entryPoint,
  expectedMethodCalls,
  swFile,
  swString,
}) => {
  assert(
    (swFile || swString) && !(swFile && swString),
    `Set swFile or swString, but not both.`,
  );

  if (swFile) {
    swString = await fse.readFile(swFile, 'utf8');
  }

  const {addEventListener, context, methodsToSpies} =
    entryPoint === 'injectManifest'
      ? setupSpiesAndContextForInjectManifest()
      : setupSpiesAndContextForGenerateSW();

  vm.runInNewContext(swString, context);

  if (expectedMethodCalls) {
    validateMethodCalls({methodsToSpies, expectedMethodCalls, context});
  }

  // Optionally check the usage of addEventListener().
  if (addEventListenerValidation) {
    addEventListenerValidation(addEventListener);
  }
};

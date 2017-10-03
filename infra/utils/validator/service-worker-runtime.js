const assert = require('assert');
const expect = require('chai').expect;
const fse = require('fs-extra');
const makeServiceWorkerEnv = require('service-worker-mock');
const sinon = require('sinon');
const vm = require('vm');

function setupSpiesAndContext() {
  const importScripts = sinon.stub();
  const methodsToSpies = {
    importScripts,
    // To make testing registerRoute() easier, return the name of the strategy.
    cacheFirst: sinon.stub().returns('cacheFirst'),
    constructor: sinon.spy(),
    precache: sinon.spy(),
    registerNavigationRoute: sinon.spy(),
    registerRoute: sinon.spy(),
  };

  class WorkboxSW {
    constructor(...args) {
      methodsToSpies.constructor(...args);
    }

    precache(...args) {
      methodsToSpies.precache(...args);
    }
  }

  WorkboxSW.prototype.router = {
    registerNavigationRoute: methodsToSpies.registerNavigationRoute,
    registerRoute: methodsToSpies.registerRoute,
  };

  WorkboxSW.prototype.strategies = {
    cacheFirst: methodsToSpies.cacheFirst,
  };

  const context = Object.assign({
    WorkboxSW,
    importScripts,
  }, makeServiceWorkerEnv());

  return {context, methodsToSpies};
}

function validateMethodCalls({methodsToSpies, expectedMethodCalls}) {
  for (const method of Object.keys(expectedMethodCalls)) {
    const spy = methodsToSpies[method];
    expect(spy.args).to.deep.equal(expectedMethodCalls[method],
      `while testing method calls for ${method}`);
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
 * @param {string} [swCode]
 * @param {Object} expectedMethodCalls
 * @return {Promise} Resolves if all of the expected method calls were made.
 */
module.exports = async ({swFile, swCode, expectedMethodCalls}) => {
  assert((swFile || swCode) && !(swFile && swCode),
    `Set swFile or swCode, but not both.`);

  if (swFile) {
    swCode = await fse.readFile(swFile, 'utf8');
  }

  const {context, methodsToSpies} = setupSpiesAndContext();

  vm.runInNewContext(swCode, context);

  validateMethodCalls({methodsToSpies, expectedMethodCalls});
};

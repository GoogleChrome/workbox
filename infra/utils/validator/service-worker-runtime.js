const assert = require('assert');
const expect = require('chai').expect;
const fse = require('fs-extra');
const makeServiceWorkerEnv = require('service-worker-mock');
const sinon = require('sinon');
const vm = require('vm');

module.exports = async ({swFile, swCode, expectedMethodCalls}) => {
  assert((swFile || swCode) && !(swFile && swCode),
    `Set swFile or swCode, but not both.`);

  if (swFile) {
    swCode = await fse.readFile(swFile, 'utf8');
  }

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
  vm.runInNewContext(swCode, context);

  for (const method of Object.keys(expectedMethodCalls)) {
    const spy = methodsToSpies[method];
    expect(spy.args).to.deep.equal(expectedMethodCalls[method],
      `while testing method calls for ${method}`);
  }
};

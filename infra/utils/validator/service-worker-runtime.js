const expect = require('chai').expect;
const fse = require('fs-extra');
const makeServiceWorkerEnv = require('service-worker-mock');
const sinon = require('sinon');
const vm = require('vm');

module.exports = async (swFile, expectedWorkboxMethodCalls) => {
  const swFileContents = await fse.readFile(swFile, 'utf8');

  const importScripts = sinon.stub();
  const methodsToSpies = {
    importScripts,
    constructor: sinon.spy(),
    precache: sinon.spy(),
    customPrecache: sinon.spy(),
  };

  class WorkboxSW {
    constructor(...args) {
      methodsToSpies.constructor(...args);
    }

    precache(...args) {
      methodsToSpies.precache(...args);
    }

    // Used in the custom-injection-point test.
    customPrecache(...args) {
      methodsToSpies.customPrecache(...args);
    }
  }

  const context = Object.assign({
    WorkboxSW,
    importScripts,
  }, makeServiceWorkerEnv());
  vm.runInNewContext(swFileContents, context);

  for (const method of Object.keys(expectedWorkboxMethodCalls)) {
    const spy = methodsToSpies[method];
    expect(spy.args).to.deep.equal(expectedWorkboxMethodCalls[method],
      `while testing method calls for ${method}`);
  }
};

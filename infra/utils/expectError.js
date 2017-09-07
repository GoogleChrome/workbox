const expect = require('chai').expect;
const logHelper = require('./log-helper');

module.exports = async (func, errorName, finalCb) => {
  let caughtError = null;
  try {
    const result = func();
    if (result && result instanceof Promise) {
      await result;
    }
  } catch (err) {
    caughtError = err;
  }

  if (!caughtError) {
    throw new Error('Expected error to be thrown but function ran correctly.');
  }
  if (caughtError.constructor.name !== 'WorkboxError') {
    logHelper.warn(`Unexpected error thrown.`, caughtError);
  }

  expect(caughtError.constructor.name).to.equal('WorkboxError');
  expect(caughtError.name).to.equal(errorName);

  if (finalCb) {
    return finalCb(caughtError);
  }
};

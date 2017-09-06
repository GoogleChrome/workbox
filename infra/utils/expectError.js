const expect = require('chai').expect;

module.exports = (func, errorName, finalCb) => {
  let caughtError = null;
  try {
    func();
  } catch (err) {
    caughtError = err;
  }

  if (!caughtError) {
    throw new Error('Expected error to be thrown but function ran correctly.');
  }

  expect(caughtError.constructor.name).to.equal('WorkboxError');
  expect(caughtError.name).to.equal(errorName);

  if (finalCb) {
    return finalCb(caughtError);
  }
};

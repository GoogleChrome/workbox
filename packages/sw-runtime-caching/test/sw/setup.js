importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sinon/pkg/sinon.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-runtime-caching/build/sw-runtime-caching.js'
);

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
  globals: ['fetch'],
});

/* eslint-disable no-unused-vars */

function expectDifferentResponseBodies(first, second) {
  return expectResponseBodyComparisonToBe(false, first, second);
}

function expectSameResponseBodies(first, second) {
  return expectResponseBodyComparisonToBe(true, first, second);
}

function expectResponseBodyComparisonToBe(shouldBeSame, first, second) {
  const firstClone = first.clone();
  const secondClone = second.clone();

  return Promise.all([firstClone.text(), secondClone.text()])
    .then(([firstBody, secondBody]) => expect(firstBody === secondBody).to.eql(shouldBeSame));
}

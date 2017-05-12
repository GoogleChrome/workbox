importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sinon/pkg/sinon-no-sourcemaps.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/__test/bundle/workbox-runtime-caching'
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

function generateCrossOriginUrl(absoluteUrlString) {
  const url = new URL(absoluteUrlString);
  // There are two servers running in the test environment, with port numbers
  // differing by 1. We can create a cross-origin version of the full URL by
  // incrementing the port number and keeping everything else the same.
  return `${url.protocol}//${url.hostname}:${parseInt(url.port) + 1}${url.pathname}`;
}

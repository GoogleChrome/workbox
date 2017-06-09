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

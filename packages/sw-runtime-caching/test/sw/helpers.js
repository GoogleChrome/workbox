const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

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

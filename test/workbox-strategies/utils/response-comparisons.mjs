import {expect} from 'chai';

function compareResponses(first, second, shouldBeSame) {
  const firstClone = first.clone();
  const secondClone = second.clone();

  return Promise.all([firstClone.text(), secondClone.text()])
    .then(([firstBody, secondBody]) => {
      return expect(firstBody === secondBody).to.eql(shouldBeSame);
    });
}

export {
  compareResponses,
};

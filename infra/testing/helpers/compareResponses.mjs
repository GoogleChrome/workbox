/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const compareResponses = async (first, second, shouldBeSame) => {
  const firstBody = await first.clone().text();
  const secondBody = await second.clone().text();

  if (shouldBeSame) {
    expect(firstBody).to.equal(secondBody);
  } else {
    expect(firstBody).to.not.equal(secondBody);
  }
};

export {compareResponses};

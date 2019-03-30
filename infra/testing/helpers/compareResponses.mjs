/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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

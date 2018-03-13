import {expect} from 'chai';

import {calculateEffectiveBoundaries} from '../../../../packages/workbox-range-requests/utils/calculateEffectiveBoundaries.mjs';
import expectError from '../../../../infra/testing/expectError';
import {devOnly} from '../../../../infra/testing/env-it';

describe(`[workbox-range-requests] utils/calculateEffectiveBoundaries`, function() {
  // This uses an interface that matches what our Blob mock currently supports.
  // It's *not* the same way we'd use native browser implementation.
  function constructBlob(length) {
    let string = '';
    for (let i = 0; i < length; i++) {
      string += i % 10;
    }
    return new Blob([string]);
  }

  const SOURCE_BLOB_SIZE = 256;
  const SOURCE_BLOB = constructBlob(SOURCE_BLOB_SIZE);

  devOnly.it(`should throw when it's is called with an invalid 'blob' parameter`, async function() {
    const invalidBlob = null;
    await expectError(
      () => calculateEffectiveBoundaries(invalidBlob),
      'incorrect-class', (error) => {
        expect(error.details).to.have.property('moduleName', 'workbox-range-requests');
        expect(error.details).to.have.property('funcName', 'calculateEffectiveBoundaries');
        expect(error.details).to.have.property('paramName', 'blob');
        expect(error.details).to.have.property('expectedClass', Blob);
      }
    );
  });

  it(`should throw when it's is called with a 'start' parameter less than zero`, async function() {
    const start = -1;
    const end = 1;
    await expectError(
      () => calculateEffectiveBoundaries(SOURCE_BLOB, start, end),
      'range-not-satisfiable'
    );
  });

  it(`should throw when it's is called with an 'end' parameter larger than the blob's size`, async function() {
    const start = 0;
    const end = SOURCE_BLOB_SIZE + 1;
    await expectError(
      () => calculateEffectiveBoundaries(SOURCE_BLOB, start, end),
      'range-not-satisfiable'
    );
  });

  it(`should return the expected boundaries when it's called with valid parameters`, function() {
    const testCases = [
      [{start: 100, end: 200}, {start: 100, end: 201}],
      [{start: null, end: 200}, {start: 56, end: 256}],
      [{start: 100, end: null}, {start: 100, end: 256}],
    ];

    for (const [sourceBoundaries, expectedBoundaries] of testCases) {
      const calculatedBoundaries = calculateEffectiveBoundaries(
        SOURCE_BLOB, sourceBoundaries.start, sourceBoundaries.end);

      expect(expectedBoundaries).to.eql(calculatedBoundaries,
        `for test case '${sourceBoundaries.start}-${sourceBoundaries.end}'`);
    }
  });
});

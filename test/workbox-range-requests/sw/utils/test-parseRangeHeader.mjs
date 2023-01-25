/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {parseRangeHeader} from 'workbox-range-requests/utils/parseRangeHeader.mjs';

describe(`parseRangeHeader()`, function () {
  it(`should throw when it's is called with an invalid 'rangeHeader' parameter`, async function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    const rangeHeader = null;
    await expectError(
      () => parseRangeHeader(rangeHeader),
      'incorrect-type',
      (error) => {
        expect(error.details).to.have.property(
          'moduleName',
          'workbox-range-requests',
        );
        expect(error.details).to.have.property('funcName', 'parseRangeHeader');
        expect(error.details).to.have.property('paramName', 'rangeHeader');
        expect(error.details).to.have.property('expectedType', 'string');
      },
    );
  });

  it(`should throw when it's is called with a rangeHeader that doesn't start with 'bytes='`, async function () {
    const rangeHeader = 'not-bytes=';
    await expectError(
      () => parseRangeHeader(rangeHeader),
      'unit-must-be-bytes',
    );
  });

  it(`should throw when it's is called with a rangeHeader contains multiple ranges`, async function () {
    const rangeHeader = 'bytes=1-2, 3-4';
    await expectError(() => parseRangeHeader(rangeHeader), 'single-range-only');
  });

  it(`should throw when it's is called with a rangeHeader contains invalid ranges`, async function () {
    const badRanges = ['invalid', '-', 'abc-def', '123 - 456'];

    for (const badRange of badRanges) {
      const rangeHeader = `bytes=${badRange}`;
      await expectError(
        () => parseRangeHeader(rangeHeader),
        'invalid-range-values',
      );
    }
  });

  it(`should return the expected start and end values when it's is called with a valid rangeHeader`, function () {
    const testCases = [
      ['bytes=100-200', {start: 100, end: 200}],
      ['bytes=-200', {start: undefined, end: 200}],
      ['bytes=100-', {start: 100, end: undefined}],
    ];

    for (const [rangeHeader, expectedValue] of testCases) {
      const boundaries = parseRangeHeader(rangeHeader);
      expect(boundaries).to.eql(
        expectedValue,
        `for test case '${rangeHeader}'`,
      );
    }
  });
});

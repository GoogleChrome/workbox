/*
 Copyright 2017 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import {
  parseRangeHeader, calculateEffectiveBoundaries, default as handleRangeRequest,
} from '../../src/lib/handle-range-request';

describe('Tests for the handle-range-request.js functions', function() {
  function constructBlob(startValue, length) {
    const buffer = new ArrayBuffer(length);
    const intView = new Uint8Array(buffer);
    for (let i = 0; i < intView.length; i++) {
      intView[i] = i + startValue;
    }
    return new Blob([buffer]);
  }

  function blobToText(blob) {
    const reader = new FileReader();
    const finished = new Promise((resolve) => {
      reader.addEventListener('loadend', (event) => {
        resolve(event.target.result);
      });
    });
    reader.readAsText(blob);

    return finished;
  }

  const SOURCE_BLOB_SIZE = 256;
  const SOURCE_BLOB = constructBlob(0, SOURCE_BLOB_SIZE);

  describe(`Tests for the parseRangeHeader() function`, function() {
    it(`should throw when it's is called with an invalid 'rangeHeader' parameter`, function() {
      const rangeHeader = null;
      expect(
        () => parseRangeHeader({rangeHeader})
      ).to.throw().with.property('name', 'assertion-failed');
    });

    it(`should throw when it's is called with a rangeHeader that doesn't start with 'bytes='`, function() {
      const rangeHeader = 'not-bytes=';
      expect(
        () => parseRangeHeader({rangeHeader})
      ).to.throw().with.property('name', 'unit-must-be-bytes');
    });

    it(`should throw when it's is called with a rangeHeader contains multiple ranges`, function() {
      const rangeHeader = 'bytes=1-2, 3-4';
      expect(
        () => parseRangeHeader({rangeHeader})
      ).to.throw().with.property('name', 'single-range-only');
    });

    it(`should throw when it's is called with a rangeHeader contains invalid ranges`, function() {
      const badRanges = [
        'invalid',
        '-',
        'abc-def',
        '123 - 456',
      ];

      for (const badRange of badRanges) {
        const rangeHeader = `bytes=${badRange}`;
        expect(
          () => parseRangeHeader({rangeHeader})
        ).to.throw().with.property('name', 'invalid-range-values', `for test case '${badRange}'`);
      }
    });

    it(`should return the expected start and end values when it's is called with a valid rangeHeader`, function() {
      const testCases = [
        ['bytes=100-200', {start: 100, end: 200}],
        ['bytes=-200', {start: null, end: 200}],
        ['bytes=100-', {start: 100, end: null}],
      ];

      for (const [rangeHeader, expectedValue] of testCases) {
        const boundaries = parseRangeHeader({rangeHeader});
        expect(boundaries).to.eql(expectedValue, `for test case '${rangeHeader}'`);
      }
    });
  });

  describe(`Tests for the calculateEffectiveBoundaries() function`, function() {
    it(`should throw when it's is called with an invalid 'blob' parameter`, function() {
      const invalidBlob = null;
      expect(
        () => calculateEffectiveBoundaries({blob: invalidBlob})
      ).to.throw().with.property('name', 'assertion-failed');
    });

    it(`should throw when it's is called with a 'start' parameter less than zero`, function() {
      const start = -1;
      const end = 1;
      expect(
        () => calculateEffectiveBoundaries({blob: SOURCE_BLOB, start, end})
      ).to.throw().with.property('name', 'range-not-satisfiable');
    });

    it(`should throw when it's is called with an 'end' parameter larger than the blob's size`, function() {
      const start = 0;
      const end = SOURCE_BLOB_SIZE + 1;
      expect(
        () => calculateEffectiveBoundaries({blob: SOURCE_BLOB, start, end})
      ).to.throw().with.property('name', 'range-not-satisfiable');
    });

    it(`should return the expected boundaries when it's called with valid parameters`, function() {
      const testCases = [
        [{start: 100, end: 200}, {start: 100, end: 201}],
        [{start: null, end: 200}, {start: 56, end: 256}],
        [{start: 100, end: null}, {start: 100, end: 256}],
      ];

      for (const [sourceBoundaries, expectedBoundaries] of testCases) {
        const calculatedBoundaries = calculateEffectiveBoundaries({
          blob: SOURCE_BLOB,
          start: sourceBoundaries.start,
          end: sourceBoundaries.end,
        });

        expect(expectedBoundaries).to.eql(calculatedBoundaries,
          `for test case '${sourceBoundaries.start}-${sourceBoundaries.end}'`);
      }
    });
  });

  describe(`Tests for the handleRangeRequest() function`, function() {
    const TEST_HEADER = 'x-test-header';
    const VALID_REQUEST = new Request('/', {
      headers: {
        range: 'bytes=100-200',
      },
    });

    const VALID_RESPONSE = new Response(SOURCE_BLOB, {
      headers: {[TEST_HEADER]: TEST_HEADER},
    });

    it(`should return a Response with status 416 when the 'request' parameter isn't valid`, async function() {
      const response = await handleRangeRequest({
        request: null,
        response: VALID_RESPONSE,
      });
      expect(response.status).to.eql(416);
    });

    it(`should return a Response with status 416 when the 'response' parameter isn't valid`, async function() {
      const response = await handleRangeRequest({
        request: VALID_REQUEST,
        response: null,
      });
      expect(response.status).to.eql(416);
    });

    it(`should return a Response with status 416 when there's no Range: header in the request`, async function() {
      const noRangeHeaderRequest = new Request('/');
      const response = await handleRangeRequest({
        request: noRangeHeaderRequest,
        response: VALID_RESPONSE,
      });
      expect(response.status).to.eql(416);
    });

    it(`should return the expected Response when it's called with valid parameters`, async function() {
      const response = await handleRangeRequest({
        request: VALID_REQUEST,
        response: VALID_RESPONSE,
      });
      expect(response.status).to.eql(206);
      expect(response.headers.has(TEST_HEADER)).to.be.true;
      expect(response.headers.get('content-length')).to.eql('101');
      expect(response.headers.get('content-range')).to.eql(`bytes 100-200/${SOURCE_BLOB_SIZE}`);

      const responseBlob = await response.blob();
      const expectedBlob = constructBlob(100, 101);
      const slicedBlobText = await blobToText(responseBlob);
      const expectedBlobText = await blobToText(expectedBlob);
      expect(slicedBlobText).to.eql(expectedBlobText);
    });
  });
});

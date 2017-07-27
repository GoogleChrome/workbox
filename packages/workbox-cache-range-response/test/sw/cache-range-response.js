importScripts('/__test/mocha/sw-utils.js');
importScripts('/__test/bundle/workbox-cache-range-response');

describe('Tests for the CacheRangeResponse class', function() {
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
    const finished = new Promise(resolve => {
      reader.addEventListener('loadend', (event) => {
        resolve(event.srcElement.result);
      });
    });
    reader.readAsText(blob);

    return finished;
  }

  const CacheRangeResponse = workbox.cacheRangeResponse.CacheRangeResponse;
  const SOURCE_BLOB_SIZE = 256;
  const SOURCE_BLOB = constructBlob(0, SOURCE_BLOB_SIZE);

  describe(`Tests for the static parseRangeHeader() function`, function() {
    it(`should throw when it's is called with an invalid 'rangeHeader' parameter`, function() {
      const rangeHeader = null;
      expect(
        () => CacheRangeResponse.parseRangeHeader({rangeHeader})
      ).to.throw().with.property('name', 'assertion-failed');
    });

    it(`should throw when it's is called with a rangeHeader that doesn't start with 'bytes='`, function() {
      const rangeHeader = 'not-bytes=';
      expect(
        () => CacheRangeResponse.parseRangeHeader({rangeHeader})
      ).to.throw().with.property('name', 'unit-must-be-bytes');
    });

    it(`should throw when it's is called with a rangeHeader contains multiple ranges`, function() {
      const rangeHeader = 'bytes= 1-2, 3-4';
      expect(
        () => CacheRangeResponse.parseRangeHeader({rangeHeader})
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
        const rangeHeader = `bytes= ${badRange}`;
        expect(
          () => CacheRangeResponse.parseRangeHeader({rangeHeader})
        ).to.throw().with.property('name', 'invalid-range-values', `for test case '${badRange}'`);
      }
    });

    it(`should return the expected start and end values when it's is called with a valid rangeHeader`, function() {
      const testCases = [
        ['bytes= 100-200', {start: 100, end: 200}],
        ['bytes= -200', {start: null, end: 200}],
        ['bytes= 100-', {start: 100, end: null}],
      ];

      for (const [rangeHeader, expectedValue] of testCases) {
        const boundaries = CacheRangeResponse.parseRangeHeader({rangeHeader});
        expect(boundaries).to.eql(expectedValue, `for test case '${rangeHeader}'`);
      }
    });
  });

  describe(`Tests for the static sliceBlob() function`, function() {
    it(`should throw when it's is called with an invalid 'blob' parameter`, function() {
      const invalidBlob = null;
      expect(
        () => CacheRangeResponse.sliceBlob({blob: invalidBlob})
      ).to.throw().with.property('name', 'assertion-failed');
    });

    it(`should throw when it's is called with a 'start' parameter less than zero`, function() {
      const start = -1;
      const end = 1;
      expect(
        () => CacheRangeResponse.sliceBlob({blob: SOURCE_BLOB, start, end})
      ).to.throw().with.property('name', 'range-not-satisfiable');
    });

    it(`should throw when it's is called with an 'end' parameter larger than the blob's size`, function() {
      const start = 0;
      const end = SOURCE_BLOB_SIZE + 1;
      expect(
        () => CacheRangeResponse.sliceBlob({blob: SOURCE_BLOB, start, end})
      ).to.throw().with.property('name', 'range-not-satisfiable');
    });

    it(`should return the expected slice of the blob when it's called with valid parameters`, async function() {
      const testCases = [
        [{start: 100, end: 200}, constructBlob(100, 101)],
        [{start: null, end: 200}, constructBlob(SOURCE_BLOB_SIZE - 200, 200)],
        [{start: 100, end: null}, constructBlob(100, SOURCE_BLOB_SIZE - 100)],
      ];

      for (const [{start, end}, expectedBlob] of testCases) {
        const slicedBlob = CacheRangeResponse.sliceBlob({blob: SOURCE_BLOB, start, end});
        const slicedBlobText = await blobToText(slicedBlob);
        const expectedBlobText = await blobToText(expectedBlob);
        expect(slicedBlobText).to.eql(expectedBlobText, `for test case '${start}-${end}'`);
      }
    });
  });

  describe(`Tests for the static sliceResponse() function`, function() {
    const TEST_HEADER = 'x-test-header';
    const VALID_REQUEST = new Request('/', {
      headers: {
        range: 'bytes= 100-200',
      },
    });

    const VALID_RESPONSE = new Response(SOURCE_BLOB, {
      headers: {[TEST_HEADER]: TEST_HEADER},
    });

    it(`should return a Response with status 416 when the 'request' parameter isn't valid`, async function() {
      const response = await CacheRangeResponse.sliceResponse({
        request: null,
        response: VALID_RESPONSE,
      });
      expect(response.status).to.eql(416);
    });

    it(`should return a Response with status 416 when the 'response' parameter isn't valid`, async function() {
      const response = await CacheRangeResponse.sliceResponse({
        request: VALID_REQUEST,
        response: null,
      });
      expect(response.status).to.eql(416);
    });

    it(`should return a Response with status 416 when there's no Range: header in the request`, async function() {
      const noRangeHeaderRequest = new Request('/');
      const response = await CacheRangeResponse.sliceResponse({
        request: noRangeHeaderRequest,
        response: VALID_RESPONSE,
      });
      expect(response.status).to.eql(416);
    });

    it(`should return the expected Response when it's called with valid parameters`, async function() {
      const response = await CacheRangeResponse.sliceResponse({
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

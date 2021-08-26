/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {createPartialResponse} from 'workbox-range-requests/createPartialResponse.mjs';

describe(`createPartialResponse()`, function () {
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

  describe(`Tests for the createPartialResponse() function`, function () {
    const VALID_REQUEST = new Request('/', {
      headers: {
        range: 'bytes=100-200',
      },
    });

    it(`should return a Response with status 416 when the 'request' parameter isn't valid`, async function () {
      const response = await createPartialResponse(
        null,
        new Response(SOURCE_BLOB),
      );
      expect(response.status).to.equal(416);
    });

    it(`should return a Response with status 416 when the 'response' parameter isn't valid`, async function () {
      const response = await createPartialResponse(VALID_REQUEST, null);
      expect(response.status).to.equal(416);
    });

    it(`should return a Response with status 416 when there's no Range: header in the request`, async function () {
      const noRangeHeaderRequest = new Request('/');
      const response = await createPartialResponse(
        noRangeHeaderRequest,
        new Response(SOURCE_BLOB),
      );
      expect(response.status).to.equal(416);
    });

    it(`should return the expected Response when it's called with valid parameters`, async function () {
      const response = await createPartialResponse(
        VALID_REQUEST,
        new Response(SOURCE_BLOB),
      );
      expect(response.status).to.equal(206);
      expect(response.headers.get('Content-Length')).to.equal('101');
      expect(response.headers.get('Content-Range')).to.equal(
        `bytes 100-200/${SOURCE_BLOB_SIZE}`,
      );

      const responseBlob = await response.blob();
      const expectedBlob = constructBlob(101);

      expect(await new Response(responseBlob).text()).to.equal(
        await new Response(expectedBlob).text(),
      );
    });

    it(`should return the full body when it's called with bytes=0-`, async function () {
      const fullBodyRequest = new Request('/', {
        headers: {
          range: 'bytes=0-',
        },
      });
      const response = await createPartialResponse(
        fullBodyRequest,
        new Response(SOURCE_BLOB),
      );
      expect(response.status).to.equal(206);
      expect(response.headers.get('Content-Length')).to.equal(
        `${SOURCE_BLOB_SIZE}`,
      );
      expect(response.headers.get('Content-Range')).to.equal(
        `bytes 0-${SOURCE_BLOB_SIZE - 1}/${SOURCE_BLOB_SIZE}`,
      );

      const responseBlob = await response.blob();
      const expectedBlob = constructBlob(SOURCE_BLOB_SIZE);

      expect(await new Response(responseBlob).text()).to.equal(
        await new Response(expectedBlob).text(),
      );
    });

    it(`should handle being passed a Response with a status of 206 by returning it as-is`, async function () {
      const originalPartialResponse = new Response('expected text', {
        status: 206,
      });
      const createdPartialResponse = await createPartialResponse(
        VALID_REQUEST,
        originalPartialResponse,
      );

      // We should get back the exact same response.
      expect(createdPartialResponse).to.equal(originalPartialResponse);
    });
  });
});

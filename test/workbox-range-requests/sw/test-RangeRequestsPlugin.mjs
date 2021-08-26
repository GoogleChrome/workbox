/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {RangeRequestsPlugin} from 'workbox-range-requests/RangeRequestsPlugin.mjs';

describe(`RangeRequestsPlugin`, function () {
  it(`should construct with no values`, function () {
    new RangeRequestsPlugin();
  });

  it(`should return an untouched response if there's no Range: request header`, async function () {
    const response = new Response();

    const plugin = new RangeRequestsPlugin();
    const resultResponse = await plugin.cachedResponseWillBeUsed({
      request: new Request('/'),
      cachedResponse: response,
    });
    expect(resultResponse).to.equal(response);
  });

  it(`should return partial response response if there's a valid Range: request header`, async function () {
    const response = new Response('hello, world.');

    const plugin = new RangeRequestsPlugin();
    const resultResponse = await plugin.cachedResponseWillBeUsed({
      request: new Request('/', {
        headers: {
          range: 'bytes=1-4',
        },
      }),
      cachedResponse: response,
    });
    expect(resultResponse).to.not.equal(response);

    const responseBody = await resultResponse.text();
    expect(responseBody).to.equal('ello');
  });

  it(`should return null when the cachedResponse is null`, async function () {
    const cachedResponse = null;
    const plugin = new RangeRequestsPlugin();
    const resultResponse = await plugin.cachedResponseWillBeUsed({
      request: new Request('/', {
        headers: {
          range: 'bytes=1-4',
        },
      }),
      cachedResponse,
    });
    expect(resultResponse).to.eql(null);
  });
});

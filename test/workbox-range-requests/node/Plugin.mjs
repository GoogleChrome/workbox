import {expect} from 'chai';

import {Plugin} from '../../../packages/workbox-range-requests/Plugin.mjs';

describe(`[workbox-range-requests] Plugin`, function() {
  it(`should construct with no values`, function() {
    new Plugin();
  });

  it(`should return untouched response if no range-request header`, async function() {
    const response = new Response();

    const plugin = new Plugin();
    const resultResponse = await plugin.cachedResponseWillBeUsed({
      request: new Request('/'),
      cachedResponse: response,
    });
    expect(resultResponse).to.equal(response);
  });

  it(`should return partial response response if range header`, async function() {
    const response = new Response('hello, world.');

    const plugin = new Plugin();
    const resultResponse = await plugin.cachedResponseWillBeUsed({
      request: new Request('/', {
        headers: {
          'range': 'bytes=1-4',
        },
      }),
      cachedResponse: response,
    });
    expect(resultResponse).to.not.equal(response);

    const responseBody = await resultResponse.text();
    expect(responseBody).to.equal('ello');
  });
});

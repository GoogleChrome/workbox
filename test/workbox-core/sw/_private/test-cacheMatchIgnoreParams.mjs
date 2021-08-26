/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheMatchIgnoreParams} from 'workbox-core/_private/cacheMatchIgnoreParams.mjs';

describe(`cacheMatchIgnoreParams()`, function () {
  const sandbox = sinon.createSandbox();
  let cache;
  const urls = [
    '/one',
    '/one?a=1',
    '/one?a=1&b=2',
    '/one?a=1&b=2&c=3',
    '/two',
    '/two?a=1',
    '/two?a=1&b=2',
    '/two?a=1&b=2&c=3',
  ];

  beforeEach(async function () {
    await caches.delete('test');
    cache = await caches.open('test');

    for (const url of urls) {
      await cache.put(new Request(url), new Response(url));
    }
    sandbox.restore();
  });

  after(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  it(`matches items in the cache ignoring the passed param(s)`, async function () {
    const key1 = new Request('/one?a=MISS&b=2');
    const match1 = await cacheMatchIgnoreParams(cache, key1, ['a']);
    expect(await match1.text()).to.equal('/one?a=1&b=2');

    const key2 = new Request('/one?a=1&b=MISS&c=3');
    const match2 = await cacheMatchIgnoreParams(cache, key2, ['b']);
    expect(await match2.text()).to.equal('/one?a=1&b=2&c=3');

    const key3 = new Request('/one?a=1&b=MISS&c=MISS');
    const match3 = await cacheMatchIgnoreParams(cache, key3, ['b', 'c']);
    expect(await match3.text()).to.equal('/one?a=1');
  });

  it(`matches the first item if there's more than one match`, async function () {
    const key = new Request('/two?a=1&b=2&c=MISS');
    const match = await cacheMatchIgnoreParams(cache, key, ['c']);

    // Event though `/two?a=1&b=2&c=3` is also a match, the URL with
    // to `c` param appears in the cache first.
    expect(await match.text()).to.equal('/two?a=1&b=2');
  });

  it(`matches as normal if the param is not present`, async function () {
    const key = new Request('/two');

    const match1 = await cacheMatchIgnoreParams(cache, key, ['c']);
    expect(await match1.text()).to.equal('/two');

    const match2 = await cacheMatchIgnoreParams(cache, key, ['a', 'b', 'c']);
    expect(await match2.text()).to.equal('/two');
  });

  it(`returns undefined if no match is found`, async function () {
    const key = new Request('/two?a=MISS&b=2');
    const match = await cacheMatchIgnoreParams(cache, key, ['b']);
    expect(match).to.equal(undefined);
  });
});

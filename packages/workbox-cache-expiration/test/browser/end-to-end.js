describe(`End to End Test of Cache Expiration`, function() {
  const BASE_URL = '/__echo/counter';
  const NUMBER_OF_REQUESTS = 15;
  const CACHE_NAME = 'cache-expiration';
  const EXPECTED_CACHE_SIZE = 5;

  beforeEach(() => goog.swUtils.cleanState());

  it(`should work properly when there are many simultaneous requests`, async function() {
    const iframe = await goog.swUtils.controlledBySW(
      '/packages/workbox-cache-expiration/test/static/cache-expiration.js');

    const fetchPromises = [];
    for (let i = 0; i < NUMBER_OF_REQUESTS; i++) {
      const url = `${BASE_URL}?param=${i}`;
      fetchPromises.push(iframe.contentWindow.fetch(url));
    }
    await Promise.all(fetchPromises);

    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    expect(keys).to.have.length(EXPECTED_CACHE_SIZE);
  });

  it(`should work properly when there are many sequential requests`, async function() {
    const iframe = await goog.swUtils.controlledBySW(
      '/packages/workbox-cache-expiration/test/static/cache-expiration.js');

    for (let i = 0; i < NUMBER_OF_REQUESTS; i++) {
      const url = `${BASE_URL}?param=${i}`;
      await iframe.contentWindow.fetch(url);
    }

    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    expect(keys).to.have.length(EXPECTED_CACHE_SIZE);
  });
});

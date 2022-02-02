import {Page} from '@playwright/test';

export async function getURLsInRuntimeCache(
  page: Page,
  scope: string,
  cacheName?: string,
): Promise<Array<string>> {
  return await page.evaluate(async (cacheName) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    return keys.map((key) => key.url);
  }, cacheName ?? scope);
}

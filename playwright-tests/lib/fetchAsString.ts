import {Page} from '@playwright/test';

export async function fetchAsString(page: Page, url: string) {
  const handle = await page.waitForFunction(async (url) => {
    const response = await fetch(url);
    return await response.text();
  }, url);
  return await handle.jsonValue();
}

export async function fetchStatus(page: Page, url: string) {
  const handle = await page.waitForFunction(async (url) => {
    const response = await fetch(url);
    return response.status;
  }, url);
  return await handle.jsonValue();
}

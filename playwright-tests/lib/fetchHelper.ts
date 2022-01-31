import {Page} from '@playwright/test';

export async function fetchAsString(page: Page, url: string): Promise<string> {
  return await page.evaluate(async (url) => {
    const response = await fetch(url);
    return await response.text();
  }, url);
}

export async function fetchStatus(page: Page, url: string): Promise<number> {
  return await page.evaluate(async (url) => {
    const response = await fetch(url);
    return response.status;
  }, url);
}

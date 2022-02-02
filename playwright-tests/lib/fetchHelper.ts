import {Frame, Page} from '@playwright/test';

export async function fetchAsString(
  client: Frame | Page,
  url: string,
): Promise<string> {
  return await client.evaluate(async (url) => {
    const response = await fetch(url);
    return await response.text();
  }, url);
}

export async function fetchStatus(
  client: Frame | Page,
  url: string,
): Promise<number> {
  return await client.evaluate(async (url) => {
    const response = await fetch(url);
    return response.status;
  }, url);
}

import {Page} from '@playwright/test';

export async function registerAndControl(
  page: Page,
  swURL = 'sw.js',
): Promise<void> {
  await page.waitForFunction(
    (swURL) => navigator.serviceWorker.register(swURL),
    swURL,
  );
  await page.waitForFunction(
    () => navigator.serviceWorker.controller?.state === 'activated',
  );
}

import {Page} from '@playwright/test';

export async function registerAndControl(
  page: Page,
  swURL = 'sw.js',
): Promise<string> {
  const scope = await page.evaluate(async (swURL) => {
    const registration = await navigator.serviceWorker.register(swURL);
    return registration.scope;
  }, swURL);

  await page.waitForFunction(
    () => navigator.serviceWorker.controller?.state === 'activated',
  );

  return scope;
}

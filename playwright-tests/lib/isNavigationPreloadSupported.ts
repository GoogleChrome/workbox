import {Page} from '@playwright/test';

declare global {
  interface ServiceWorkerRegistration {
    readonly navigationPreload: unknown;
  }
}

export async function isNavigationPreloadSupported(
  page: Page,
): Promise<boolean> {
  return await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.navigationPreload);
  });
}

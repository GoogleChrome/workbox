import {Frame, Page} from '@playwright/test';

export async function waitForSWMessage<T>(client: Frame | Page): Promise<T> {
  return await client.evaluate(async () => {
    const promiseForData = new Promise<T>((resolve) => {
      navigator.serviceWorker.addEventListener(
        'message',
        (event: MessageEvent<T>) => resolve(event.data),
        {once: true},
      );
    });
    return await promiseForData;
  });
}

import {test, expect} from '@playwright/test';

import {fetchAsString} from '../../lib/fetchAsString';
import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {IframeManager} from '../../lib/iframeManager';
import {registerAndControl} from '../../lib/registerAndControl';

declare global {
  interface Window {
    __messages: Array<string>;
  }
}

test('broadcast a message after a cache update to a regular request', async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const apiURL = `${baseURL}/__WORKBOX/uniqueETag`;
  const firstResponse = await fetchAsString(page, apiURL);
  expect(firstResponse).toMatch(/ETag is \d+\./);

  const messageDataPromise = page.evaluate(async () => {
    const promiseForData = new Promise<Record<string, any>>((resolve) => {
      navigator.serviceWorker.addEventListener(
        'message',
        (event: MessageEvent<Record<string, any>>) => {
          resolve(event.data);
        },
      );
    });
    return await promiseForData;
  });

  const secondResponse = await fetchAsString(page, apiURL);
  expect(secondResponse).toBe(firstResponse);

  const messageData = await messageDataPromise;
  expect(messageData).toStrictEqual({
    type: 'CACHE_UPDATED',
    meta: 'workbox-broadcast-update',
    payload: {
      cacheName: 'bcu-integration-test',
      updatedURL: apiURL,
    },
  });
});

test('broadcast a message after a cache update to a navigation request', async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(
    baseURL,
    __dirname,
    'unique-with-message.html',
  );
  await page.goto(url);
  await registerAndControl(page);

  await page.goto(url);
  const firstBody = await page.innerText('body');

  await page.goto(url);
  const secondBody = await page.innerText('body');

  expect(secondBody).toBe(firstBody);

  const messagesHandle = await page.waitForFunction(() => {
    return window.__messages.length > 0 ? window.__messages : false;
  });
  const messages = await messagesHandle.jsonValue();

  expect(messages).toStrictEqual([
    {
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: url,
      },
    },
  ]);
});

test(`broadcast a message to all open clients by default`, async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(
    baseURL,
    __dirname,
    'unique-with-message.html',
  );
  await page.goto(url);
  await registerAndControl(page);
  const iframeManager = new IframeManager(page);

  await page.goto(url);
  await page.waitForFunction((url) => window.caches.match(url), url);

  const iframe = await iframeManager.createIframeClient(url);

  const pageMessagesHandle = await page.waitForFunction(() => {
    return window.__messages.length > 0 ? window.__messages : false;
  });
  const pageMessages = await pageMessagesHandle.jsonValue();

  expect(pageMessages).toStrictEqual([
    {
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: url,
      },
    },
  ]);

  const iframeMessagesHandle = await iframe.waitForFunction(() => {
    return window.__messages.length > 0 ? window.__messages : false;
  });
  const iframeMessages = await iframeMessagesHandle.jsonValue();

  expect(iframeMessages).toStrictEqual([
    {
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: url,
      },
    },
  ]);
});

test(`broadcast a message to the client that made the request when notifyAllClients is false`, async ({
  baseURL,
  page,
}) => {
  const apiURL = `${baseURL}/__WORKBOX/uniqueETag?notifyAllClientsTest`;
  const url = generateIntegrationURL(
    baseURL,
    __dirname,
    'unique-with-message.html',
  );
  await page.goto(url);
  const scope = await registerAndControl(page);

  const iframeManager = new IframeManager(page);
  const iframe = await iframeManager.createIframeClient(url);

  await page.evaluate((apiURL) => fetch(apiURL), apiURL);
  await page.waitForFunction((apiURL) => window.caches.match(apiURL), apiURL);

  await iframe.evaluate((apiURL) => fetch(apiURL), apiURL);

  const iframeMessagesHandle = await iframe.waitForFunction(() => {
    return window.__messages.length > 0 ? window.__messages : false;
  });
  const iframeMessages = await iframeMessagesHandle.jsonValue();

  expect(iframeMessages).toStrictEqual([
    {
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: `workbox-runtime-${scope}`,
        updatedURL: apiURL,
      },
    },
  ]);

  const pageMessages = await page.evaluate(() => window.__messages);
  expect(pageMessages).toStrictEqual([]);
});

import {test, expect} from '@playwright/test';

import {fetchAsString} from '../lib/fetchHelper';
import {generateIntegrationURL} from '../lib/generateIntegrationURL';
import {IframeManager} from '../lib/iframeManager';
import {registerAndControl} from '../lib/registerAndControl';
import {waitForSWMessage} from '../lib/waitForSWMessage';

declare global {
  interface Window {
    __messages: Array<string>;
  }
}

test('broadcast a message after a cache update to a regular request', async ({
  baseURL,
  page,
}) => {
  const apiURL = `${baseURL}/__WORKBOX/uniqueETag`;
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  const scope = await registerAndControl(page);

  const firstResponse = await fetchAsString(page, apiURL);

  expect(firstResponse).toMatch(/ETag is \d+\./);

  const [messageData, secondResponse] = await Promise.all([
    waitForSWMessage<Record<string, any>>(page),
    fetchAsString(page, apiURL),
  ]);

  expect(secondResponse).toBe(firstResponse);
  expect(messageData).toStrictEqual({
    type: 'CACHE_UPDATED',
    meta: 'workbox-broadcast-update',
    payload: {
      cacheName: scope,
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
  const scope = await registerAndControl(page);

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
        cacheName: scope,
        updatedURL: url,
      },
    },
  ]);
});

test(`broadcast a message to all open clients by default`, async ({
  baseURL,
  page,
}) => {
  const apiURL = `${baseURL}/__WORKBOX/uniqueETag`;
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  const scope = await registerAndControl(page);

  const iframeManager = new IframeManager(page);
  const iframe = await iframeManager.createIframeClient(url);

  await fetchAsString(page, apiURL);

  const [pageMessage, iframeMessage] = await Promise.all([
    waitForSWMessage<Record<string, any>>(page),
    waitForSWMessage<Record<string, any>>(iframe),
    fetchAsString(iframe, apiURL),
  ]);

  expect(pageMessage).toStrictEqual({
    type: 'CACHE_UPDATED',
    meta: 'workbox-broadcast-update',
    payload: {
      cacheName: scope,
      updatedURL: apiURL,
    },
  });
  expect(iframeMessage).toStrictEqual(pageMessage);
});

test(`broadcast a message to only the client that made the request when notifyAllClients is false`, async ({
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

  await fetchAsString(page, apiURL);

  const [iframeMessage] = await Promise.all([
    waitForSWMessage<Record<string, any>>(iframe),
    fetchAsString(iframe, apiURL),
  ]);

  expect(iframeMessage).toStrictEqual({
    type: 'CACHE_UPDATED',
    meta: 'workbox-broadcast-update',
    payload: {
      cacheName: scope,
      updatedURL: apiURL,
    },
  });

  const windowMessages = await page.evaluate(() => window.__messages);
  expect(windowMessages).toStrictEqual([]);
});

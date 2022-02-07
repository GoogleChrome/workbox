import {expect, test} from '@playwright/test';

import {generateIntegrationURL} from '../lib/generateIntegrationURL';
import {IframeManager} from '../lib/iframeManager';
import {isNavigationPreloadSupported} from '../lib/isNavigationPreloadSupported';
import {registerAndControl} from '../lib/registerAndControl';
import {waitForSWMessage} from '../lib/waitForSWMessage';

test('makes a preload request, or a network request if not supported', async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const supported = await isNavigationPreloadSupported(page);

  const iframeManager = new IframeManager(page);

  const [message] = await Promise.all([
    waitForSWMessage<Record<string, any>>(page),
    iframeManager.createIframeClient(url),
  ]);

  expect(message).toStrictEqual(supported ? {} : {requestWillFetch: true});
});

test('disables navigation preload (if supported)', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const supported = await isNavigationPreloadSupported(page);
  test.skip(!supported, 'Navigation preload is not supported.');

  const iframeManager = new IframeManager(page);

  const [firstMessage, iframe] = await Promise.all([
    waitForSWMessage<Record<string, any>>(page),
    iframeManager.createIframeClient(url),
  ]);

  expect(firstMessage).toStrictEqual({});

  await registerAndControl(page, 'sw-disable.js');

  const [secondMessage] = await Promise.all([
    waitForSWMessage<Record<string, any>>(page),
    iframe.goto(url),
  ]);

  expect(secondMessage).toStrictEqual({requestWillFetch: true});
});

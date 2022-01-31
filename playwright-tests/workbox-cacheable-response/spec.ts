import {test, expect} from '@playwright/test';

import {fetchStatus} from '../lib/fetchHelper';
import {getURLsInRuntimeCache} from '../lib/getURLsInRuntimeCache';
import {generateIntegrationURL} from '../lib/generateIntegrationURL';
import {registerAndControl} from '../lib/registerAndControl';
import {waitForSWMessage} from '../lib/waitForSWMessage';

test('not cache a 200, but not 404 response', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  const scope = await registerAndControl(page);

  const [message, firstStatus, secondStatus] = await Promise.all([
    waitForSWMessage<{handlerDidComplete: string}>(page),
    fetchStatus(page, 'example-1.txt'),
    fetchStatus(page, '/bad/url/does/not/exist'),
  ]);

  expect(firstStatus).toBe(200);
  expect(secondStatus).toBe(404);

  const cachedURLs = await getURLsInRuntimeCache(page, scope);

  expect(cachedURLs).toStrictEqual([message.handlerDidComplete]);
});

test('cache a 404 response when configured', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  const scope = await registerAndControl(page);

  const [message, status] = await Promise.all([
    waitForSWMessage<{handlerDidComplete: string}>(page),
    fetchStatus(page, '/this/is/a/cacheable-404'),
  ]);

  expect(status).toBe(404);

  const cachedURLs = await getURLsInRuntimeCache(page, scope);

  expect(cachedURLs).toStrictEqual([message.handlerDidComplete]);
});

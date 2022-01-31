import {test, expect} from '@playwright/test';

import {getURLsInRuntimeCache} from '../../lib/getURLsInRuntimeCache';
import {fetchAsString} from '../../lib/fetchHelper';
import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {registerAndControl} from '../../lib/registerAndControl';
import {waitForSWMessage} from '../../lib/waitForSWMessage';

test('honor the maxEntries configuration', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  const scope = await registerAndControl(page);

  const [firstMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-1.txt'),
  ]);

  const [secondMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-2.txt'),
  ]);

  const [thirdMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-3.txt'),
  ]);

  const firstCachedURLs = await getURLsInRuntimeCache(page, scope, scope);
  expect(firstCachedURLs).toStrictEqual([
    firstMessage.cachedURL,
    secondMessage.cachedURL,
    thirdMessage.cachedURL,
  ]);

  const [fourthMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-4.txt'),
  ]);

  const [fifthMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-5.txt'),
  ]);

  const secondCachedURLs = await getURLsInRuntimeCache(page, scope, scope);
  expect(secondCachedURLs).toStrictEqual([
    thirdMessage.cachedURL,
    fourthMessage.cachedURL,
    fifthMessage.cachedURL,
  ]);

  const [sixthMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-1.txt'),
  ]);

  const thirdCachedURLs = await getURLsInRuntimeCache(page, scope, scope);
  expect(thirdCachedURLs).toStrictEqual([
    fourthMessage.cachedURL,
    fifthMessage.cachedURL,
    sixthMessage.cachedURL,
  ]);
});

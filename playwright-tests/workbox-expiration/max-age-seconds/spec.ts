import {test, expect} from '@playwright/test';

import {getURLsInRuntimeCache} from '../../lib/getURLsInRuntimeCache';
import {fetchAsString} from '../../lib/fetchHelper';
import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {registerAndControl} from '../../lib/registerAndControl';
import {sleep} from '../../lib/sleep';
import {waitForSWMessage} from '../../lib/waitForSWMessage';

test('honor the maxAgeSeconds configuration', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  const scope = await registerAndControl(page);

  const [firstMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-1.txt'),
  ]);

  const firstCachedURLs = await getURLsInRuntimeCache(page, scope);
  expect(firstCachedURLs).toStrictEqual([firstMessage.cachedURL]);

  await sleep(1001);

  const [secondMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-2.txt'),
  ]);

  const secondCachedURLs = await getURLsInRuntimeCache(page, scope);
  expect(secondCachedURLs).toStrictEqual([secondMessage.cachedURL]);
});

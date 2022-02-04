import {test, expect} from '@playwright/test';

import {getObjectStoreEntries} from '../../lib/getObjectStoreEntries';
import {getURLsInRuntimeCache} from '../../lib/getURLsInRuntimeCache';
import {fetchAsString} from '../../lib/fetchHelper';
import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {registerAndControl} from '../../lib/registerAndControl';
import {waitForSWMessage} from '../../lib/waitForSWMessage';

test('should clean up when deleteCacheAndMetadata() is called', async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  // Expose the idb library in our test page.
  await page.addScriptTag({
    url: '/node_modules/idb/build/iife/index-min.js',
  });
  const scope = await registerAndControl(page);

  const [cacheMessage] = await Promise.all([
    waitForSWMessage<{cachedURL: string}>(page),
    fetchAsString(page, 'example-1.txt'),
  ]);
  const keys = await getURLsInRuntimeCache(page, scope);

  expect(keys).toStrictEqual([cacheMessage.cachedURL]);

  const initialEntries = await getObjectStoreEntries(
    page,
    'workbox-expiration',
    'cache-entries',
  );

  expect(initialEntries).toHaveLength(1);

  const [deletionMessage] = await Promise.all([
    waitForSWMessage<string>(page),
    page.evaluate(() =>
      navigator.serviceWorker.controller?.postMessage('delete'),
    ),
  ]);

  expect(deletionMessage).toBe('success');

  const emptyKeys = await getURLsInRuntimeCache(page, scope);

  expect(emptyKeys).toStrictEqual([]);

  const emptyEntries = await getObjectStoreEntries(
    page,
    'workbox-expiration',
    'cache-entries',
  );

  expect(emptyEntries).toHaveLength(0);
});

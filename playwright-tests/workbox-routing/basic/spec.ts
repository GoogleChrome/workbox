import {test, expect} from '@playwright/test';

import {fetchAsString, fetchStatus} from '../../lib/fetchAsString';
import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {registerAndControl} from '../../lib/registerAndControl';

test('use a route created by a Route object', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const testURL = `${baseURL}/routeObject`;
  const value = await fetchAsString(page, testURL);
  expect(value).toBe(testURL);
});

test('use a same-origin route created by a string', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const testURL = `${baseURL}/sameOrigin`;
  const value = await fetchAsString(page, testURL);
  expect(value).toBe(testURL);
});

test('use a cross-origin route created by a string', async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const testURL = 'https://example.com/crossOrigin';
  const value = await fetchAsString(page, testURL);
  expect(value).toBe(testURL);
});

test('return a 404 when no route matches', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const testURL = `${baseURL}/doesNotMatch`;
  const status = await fetchStatus(page, testURL);
  expect(status).toBe(404);
});

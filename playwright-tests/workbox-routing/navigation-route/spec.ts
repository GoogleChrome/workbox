import {test, expect} from '@playwright/test';

import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {registerAndControl} from '../../lib/registerAndControl';

test('use NavigationRoute for all navigations', async ({page, baseURL}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const nestedURL = url + 'TestNavigationURL';
  await page.goto(nestedURL);

  const body = await page.innerText('body');
  expect(body).toBe(`NavigationRoute.${nestedURL}`);
});

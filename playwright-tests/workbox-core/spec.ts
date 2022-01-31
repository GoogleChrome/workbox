import {test} from '@playwright/test';

import {generateIntegrationURL} from '../lib/generateIntegrationURL';
import {registerAndControl} from '../lib/registerAndControl';

test('registers the SW without errors', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);
});

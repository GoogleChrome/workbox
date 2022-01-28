import {test, expect} from '@playwright/test';

import {fetchAsString} from '../../lib/fetchAsString';
import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {registerAndControl} from '../../lib/registerAndControl';

test('use a route created by a RegExp', async ({baseURL, page}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  let testCounter = 0;
  let value: string;
  value = await fetchAsString(page, `${baseURL}/RegExp/${testCounter}/`);
  expect(value).toBe(`RegExp.${baseURL}/RegExp/${testCounter}/`);

  testCounter += 1;
  value = await fetchAsString(page, `/regular-expression/${testCounter}/`);
  expect(value).toBe(
    `regular-expression.${baseURL}/regular-expression/${testCounter}/`,
  );

  testCounter += 1;
  value = await fetchAsString(page, `/RegExpRoute/RegExp/${testCounter}/`);
  expect(value).toBe(
    `RegExpRoute.RegExp.${baseURL}/RegExpRoute/RegExp/${testCounter}/`,
  );

  testCounter += 1;
  value = await fetchAsString(
    page,
    `/RegExpRoute/regular-expression/${testCounter}/`,
  );
  expect(value).toBe(
    `RegExpRoute.regular-expression.${baseURL}/RegExpRoute/regular-expression/${testCounter}/`,
  );
});

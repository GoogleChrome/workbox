import {expect, test} from '@playwright/test';

import {generateIntegrationURL} from '../../lib/generateIntegrationURL';
import {IframeManager} from '../../lib/iframeManager';
import {isNavigationPreloadSupported} from '../../lib/isNavigationPreloadSupported';
import {registerAndControl} from '../../lib/registerAndControl';
import {waitForSWMessage} from '../../lib/waitForSWMessage';

test('makes a network request if navigation preload is supported', async ({
  baseURL,
  page,
}) => {
  const url = generateIntegrationURL(baseURL, __dirname);
  await page.goto(url);
  await registerAndControl(page);

  const supported = await isNavigationPreloadSupported(page);
  test.skip(!supported, 'Navigation preload not supported.');

  const iframeManager = new IframeManager(page);

  const [message] = await Promise.all([
    waitForSWMessage<Record<string, any>>(page),
    iframeManager.createIframeClient(url),
  ]);

  expect(message).toStrictEqual({});
});

/*
  it(`should make a network request if navigation preload is supported`, async function () {
    await activateAndControlSW(`${baseURL}sw-default-header.js`);

    const isEnabled = await runInSW('isNavigationPreloadSupported');

    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(0);

    await global.__workbox.webdriver.get(integrationURL);

    // If navigation preload is enabled, there should be 1 request. Otherwise,
    // no requests.
    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(
      isEnabled ? 1 : 0,
    );

    // Check to make sure that the correct header value was sent if navigation
    // preload is enabled.
    expect(requestCounter.getHeaderCount('true')).to.eql(isEnabled ? 1 : 0);
  });

  it(`should make a network request if navigation preload is supported, with a custom header value`, async function () {
    await activateAndControlSW(`${baseURL}sw-custom-header.js`);

    const isEnabled = await runInSW('isNavigationPreloadSupported');

    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(0);

    await global.__workbox.webdriver.get(integrationURL);

    // If navigation preload is enabled, there should be 1 request. Otherwise,
    // no requests.
    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(
      isEnabled ? 1 : 0,
    );

    // Check to make sure that the correct header value was sent if navigation
    // preload is enabled.
    expect(requestCounter.getHeaderCount('custom-value')).to.eql(
      isEnabled ? 1 : 0,
    );

    // There shouldn't be any requests with the default header value, 'true'.
    expect(requestCounter.getHeaderCount('true')).to.eql(0);
  });
  */

/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


// Store local references of these globals.
const {server, webdriver} = global.__workbox;

const testServerOrigin = server.getAddress();

/**
 * Gets the window handle of the last opened tab.
 *
 * @return {string}
 */
const getLastWindowHandle = async () => {
  let lastWindowHandle;

  // Save the handle so that we can switch back before returning.
  const currentWindowHandle = await webdriver.getWindowHandle();

  const allWindowHandles = await webdriver.getAllWindowHandles();
  // reverse() the list so that we will iterate through the last one first.
  allWindowHandles.reverse();

  for (const handle of allWindowHandles) {
    await webdriver.switchTo().window(handle);
    const currentUrl = await webdriver.getCurrentUrl();
    if (currentUrl.startsWith(testServerOrigin)) {
      lastWindowHandle = handle;
      break;
    } else {
      // Used for debugging failing tests with unexpected windows openning.
      // eslint-disable-next-line no-console
      console.log(`Unexpected window opened: ${currentUrl}`);
    }
  }

  await webdriver.switchTo().window(currentWindowHandle);
  if (lastWindowHandle) {
    return lastWindowHandle;
  }

  // If we can't find anything, treat that as a fatal error.
  throw new Error(`Unable to a window with origin ${testServerOrigin}.`);
};

module.exports = {getLastWindowHandle};

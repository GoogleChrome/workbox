/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


const {getLastWindowHandle} = require('./getLastWindowHandle');

// Store local references of these globals.
const {webdriver} = global.__workbox;

/**
 * Opens a new window for the passed URL. If no URL is passed, a blank page
 * is opened.
 *
 * @param {string} url
 * @param {Object} options
 * @return {string}
 */
const openNewTab = async (url) => {
  await webdriver.executeAsyncScript((url, cb) => {
    window.open(url);
    cb();
  }, url);

  const lastHandle = await getLastWindowHandle();
  await webdriver.switchTo().window(lastHandle);

  // Return the handle of the window that was just opened.
  return lastHandle;
};

module.exports = {openNewTab};

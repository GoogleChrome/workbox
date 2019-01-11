/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


// Store local references of these globals.
const {webdriver} = global.__workbox;

/**
 * Gets the window handle of the last openned tab.
 *
 * @return {string}
 */
const getLastWindowHandle = async () => {
  const allHandles = await webdriver.getAllWindowHandles();
  return allHandles[allHandles.length - 1];
};

module.exports = {getLastWindowHandle};

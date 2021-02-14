/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * Wraps methods in the underlying webdriver API to create, switch between,
 * and close tabs in a browser.
 */
class TabManager {
  /**
   * @param {WebDriver} driver
   *
   * @private
   */
  constructor(driver) {
    this._driver = driver;
    this._openedHandles = new Set();
    this._initialHandle = null;
  }

  async openTab(url) {
    if (this._initialHandle === null) {
      this._initialHandle = await this._driver.getWindowHandle();
    }

    await this._driver.switchTo().newWindow('tab');
    this._openedHandles.add(await this._driver.getWindowHandle());

    await this._driver.get(url);
  }

  async closeOpenedTabs() {
    for (const handle of this._openedHandles) {
      await this._driver.switchTo().window(handle);
      await this._driver.close();
    }
    this._openedHandles = new Set();

    if (this._initialHandle) {
      await this._driver.switchTo().window(this._initialHandle);
    }
  }
}

module.exports = {TabManager};

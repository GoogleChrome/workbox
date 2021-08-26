/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const PREFIX = 'iframe-';
const waitUntil = require('../wait-until');

class Client {
  constructor(driver, id) {
    this._driver = driver;
    this._id = id;
  }

  async executeAsyncScript(code) {
    const value = await this._driver.executeAsyncScript(
      (id, code, cb) => {
        const iframe = document.querySelector(`#${id}`);
        Promise.resolve(iframe.contentWindow.eval(code))
          .then((value) => cb(value))
          .catch((err) => cb(err.toString()));
      },
      this._id,
      code,
    );

    return value;
  }

  async wait(code) {
    await waitUntil(() => this.executeAsyncScript(code));
  }

  remove() {
    this._driver.executeScript((id) => {
      const el = document.querySelector(`#${id}`);
      document.body.removeChild(el);
    }, this._id);
  }
}

/**
 * Wraps methods in the underlying webdriver API to create, switch between,
 * and close tabs in a browser.
 */
class IframeManager {
  /**
   * @param {WebDriver} driver
   *
   * @private
   */
  constructor(driver) {
    this._driver = driver;
    this._clients = new Set();
  }

  async createIframeClient(url) {
    const iframeId = await this._driver.executeAsyncScript(
      (url, prefix, cb) => {
        const el = document.createElement('iframe');
        if (!('iframeCount' in window)) {
          window.iframeCount = 1;
        }
        const id = `${prefix}${window.iframeCount++}`;
        el.addEventListener('load', () => {
          cb(id);
        });
        el.src = url;
        el.id = id;
        document.body.appendChild(el);
      },
      url,
      PREFIX,
    );

    return new Client(this._driver, iframeId);
  }
}

module.exports = {IframeManager};

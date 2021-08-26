/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {executeAsyncAndCatch} = require('./executeAsyncAndCatch');

/**
 * Waits for the current window to load if it's not already loaded.
 */
const windowLoaded = async () => {
  // Wait for the window to load, so the `Workbox` global is available.
  await executeAsyncAndCatch(async (cb) => {
    const loaded = () => {
      if (!window.Workbox) {
        cb({
          error: `window.Workbox is undefined; location is ${location.href}`,
        });
      } else {
        cb();
      }
    };

    try {
      if (document.readyState === 'complete') {
        loaded();
      } else {
        addEventListener('load', () => loaded());
      }
    } catch (error) {
      cb({error: error.stack});
    }
  });
};

module.exports = {windowLoaded};

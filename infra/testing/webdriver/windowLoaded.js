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
    try {
      if (document.readyState === 'complete') {
        cb();
      } else {
        addEventListener('load', () => cb());
      }
    } catch (error) {
      cb({error: error.stack});
    }
  });
};

module.exports = {windowLoaded};

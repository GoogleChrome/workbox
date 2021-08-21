/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {executeAsyncAndCatch} = require('./executeAsyncAndCatch');

/**
 * Unregisters any active SWs so the next page load can start clean.
 * Note: a new page load is needed before controlling SWs stop being active.
 */
const unregisterAllSWs = async () => {
  await executeAsyncAndCatch(async (cb) => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
      cb();
    } catch (error) {
      cb({error: error.stack});
    }
  });
};

module.exports = {unregisterAllSWs};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from './logger.mjs';
import {assert} from './assert.mjs';

import '../_version.mjs';

const callbacks = new Set();

/**
 * Adds a function to the set of callbacks that will be executed when there's
 * a quota error.
 *
 * @param {Function} callback
 * @memberof workbox.core
 */
function registerQuotaErrorCallback(callback) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isType(callback, 'function', {
      moduleName: 'workbox-core',
      funcName: 'register',
      paramName: 'callback',
    });
  }

  callbacks.add(callback);

  if (process.env.NODE_ENV !== 'production') {
    logger.log('Registered a callback to respond to quota errors.', callback);
  }
}

/**
 * Runs all of the callback functions, one at a time sequentially, in the order
 * in which they were registered.
 *
 * @memberof workbox.core
 * @private
 */
async function executeQuotaErrorCallbacks() {
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`About to run ${callbacks.size} callbacks to clean up caches.`);
  }

  for (const callback of callbacks) {
    await callback();
    if (process.env.NODE_ENV !== 'production') {
      logger.log(callback, 'is complete.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.log('Finished running callbacks.');
  }
}

export {
  executeQuotaErrorCallbacks,
  registerQuotaErrorCallback,
};

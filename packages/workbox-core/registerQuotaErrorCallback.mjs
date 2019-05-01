/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from './_private/logger.mjs';
import {assert} from './_private/assert.mjs';
import {quotaErrorCallbacks} from './models/quotaErrorCallbacks.mjs';
import './_version.mjs';


/**
 * Adds a function to the set of quotaErrorCallbacks that will be executed if
 * there's a quota error.
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

  quotaErrorCallbacks.add(callback);

  if (process.env.NODE_ENV !== 'production') {
    logger.log('Registered a callback to respond to quota errors.', callback);
  }
}

export {registerQuotaErrorCallback};

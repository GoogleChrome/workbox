/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from './_private/logger';
import {assert} from './_private/assert';
import {quotaErrorCallbacks} from './models/quotaErrorCallbacks';
import './_version';


/**
 * Adds a function to the set of quotaErrorCallbacks that will be executed if
 * there's a quota error.
 *
 * @param {Function} callback
 * @memberof workbox.core
 */
function registerQuotaErrorCallback(callback: Function) {
  if (process.env.NODE_ENV !== 'production') {
    assert && assert.isType(callback, 'function', {
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

/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxPlugin} from 'workbox-core/types.js';

import {matchPrecache} from './matchPrecache.js';

import './_version.js';


/**
 * `PrecacheFallbackPlugin` allows you to specify an "offline fallback"
 * response to be used when a given strategy is unable to generate a response.
 *
 * It does this by intercepting the `handlerDidError` plugin callback
 * and returning a precached response, taking the expected revision parameter
 * into account automatically.
 * 
 * This plugin works with the "default" `PrecacheController` instance, and
 * should not be used if you explicitly create your own `PrecacheController`.
 *
 * @memberof module:workbox-precaching
 */
class PrecacheFallbackPlugin implements WorkboxPlugin {
  private readonly _fallbackURL: string;

  /**
   * Constructs a new PrecacheFallbackPlugin with the associated fallbackURL.
   *
   * @param {Object} config
   * @param {string} config.fallbackURL A precached URL to use as the fallback
   *     if the associated strategy can't generate a response.
   */
  constructor({fallbackURL}: {fallbackURL: string}) {
    this._fallbackURL = fallbackURL;
  }

  /**
   * @return {Promise<Response>} The precache response for the fallback URL.
   *
   * @private
   */
  handlerDidError: WorkboxPlugin['handlerDidError'] =
    () => matchPrecache(this._fallbackURL);
}

export {PrecacheFallbackPlugin};

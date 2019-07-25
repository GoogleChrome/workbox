/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {getOrCreatePrecacheController} from './utils/getOrCreatePrecacheController.js';

import './_version.js';

/**
 * Helper function that calls
 * {@link PrecacheController#createHandlerForURL} on the default
 * {@link PrecacheController} instance.
 * 
 * If you are creating your own {@link PrecacheController}, then call the
 * {@link PrecacheController#createHandlerForURL} on that instance,
 * instead of using this function.
 *
 * @param {string} url The precached URL which will be used to lookup the
 * `Response`.
 * @return {workbox.routing.Route~handlerCallback}
 *
 * @alias workbox.precaching.createHandlerForURL
 */
export const createHandlerForURL = (url: string) => {
  const precacheController = getOrCreatePrecacheController();
  return precacheController.createHandlerForURL(url);
};

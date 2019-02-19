/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {getOrCreateDefaultRouter} from './utils/getOrCreateDefaultRouter.mjs';

import './_version.mjs';

/**
 * Define a default `handler` that's called when no routes explicitly
 * match the incoming request.
 *
 * Without a default handler, unmatched requests will go against the
 * network as if there were no service worker present.
 *
 * @param {workbox.routing.Route~handlerCallback} handler A callback
 * function that returns a Promise resulting in a Response.
 *
 * @alias workbox.routing.setDefaultHandler
 */
export const setDefaultHandler = (handler) => {
  const defaultRouter = getOrCreateDefaultRouter();
  defaultRouter.setDefaultHandler(handler);
};

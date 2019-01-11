/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Router} from '../Router.mjs';
import '../_version.mjs';

let defaultRouter;

/**
 * @return {Router}
 */
export const getOrCreateDefaultRouter = () => {
  if (!defaultRouter) {
    defaultRouter = new Router();

    // The helpers that use the default Router assume these listeners exist.
    defaultRouter.addFetchListener();
    defaultRouter.addCacheListener();
  }
  return defaultRouter;
};

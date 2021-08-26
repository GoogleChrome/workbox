/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {getOrCreatePrecacheController} from 'workbox-precaching/utils/getOrCreatePrecacheController.mjs';

export function resetDefaultPrecacheController() {
  const pc = getOrCreatePrecacheController();

  pc._urlsToCacheKeys.clear();
  pc._urlsToCacheModes.clear();
  pc._cacheKeysToIntegrities.clear();

  pc._installAndActiveListenersAdded = false;
}

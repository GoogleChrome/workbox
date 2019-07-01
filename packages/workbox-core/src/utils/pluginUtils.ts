/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.js';

export interface Plugin {
  cacheDidUpdate: Function;
  cacheKeyWillBeUsed: Function;
  cacheWillUpdate: Function;
  cachedResponseWillBeUsed: Function;
  fetchDidFail: Function;
  fetchDidSucceed: Function;
  requestWillFetch: Function;
}

export const pluginUtils = {
  filter: (plugins: Plugin[], callbackName: string) => {
    return plugins.filter((plugin) => callbackName in plugin);
  },
};

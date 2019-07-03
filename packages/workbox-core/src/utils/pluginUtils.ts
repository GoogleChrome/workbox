/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.js';

export interface WorkboxPlugin {
  cacheDidUpdate?: Function;
  cacheKeyWillBeUsed?: Function;
  cacheWillUpdate?: Function;
  cachedResponseWillBeUsed?: Function;
  fetchDidFail?: ({request}: {request: Request}) => Promise<void>;
  fetchDidSucceed?: Function;
  requestWillFetch?: Function;
}

export const pluginUtils = {
  filter: (plugins: WorkboxPlugin[], callbackName: string) => {
    return plugins.filter((plugin) => callbackName in plugin);
  },
};

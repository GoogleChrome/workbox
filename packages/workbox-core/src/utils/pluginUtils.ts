/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.js';

export interface WorkboxPlugin {
  cacheDidUpdate?: ({
    cacheName,
    oldResponse,
    newResponse,
    request,
    event
  }: {
    cacheName: string,
    oldResponse?: Response,
    newResponse: Response,
    request: Request,
    event?: FetchEvent
  }) => Promise<void>;
  cacheKeyWillBeUsed?: Function;
  cacheWillUpdate?: ({
    response
  }: {
    response: Response
  }) => Promise<Response | null>;
  cachedResponseWillBeUsed?: Function;
  fetchDidFail?: ({
    request
  }: {
    request: Request
  }) => Promise<void>;
  fetchDidSucceed?: Function;
  requestWillFetch?: Function;
}

export const pluginUtils = {
  filter: (plugins: WorkboxPlugin[], callbackName: string) => {
    return plugins.filter((plugin) => callbackName in plugin);
  },
};

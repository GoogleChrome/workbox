/*
  Copyright 2020 Google LLC
  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// This is used to validate the DefinePlugin's replacement.
const prefix = __PREFIX__;
workbox.core.setCacheNameDetails({prefix});

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {});

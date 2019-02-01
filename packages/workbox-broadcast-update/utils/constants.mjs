/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

export const CACHE_UPDATED_MESSAGE_TYPE = 'CACHE_UPDATED';
export const CACHE_UPDATED_MESSAGE_META = 'workbox-broadcast-update';
export const DEFAULT_BROADCAST_CHANNEL_NAME = 'workbox';
export const DEFAULT_DEFER_NOTIFICATION_TIMEOUT = 10000;
export const DEFAULT_HEADERS_TO_CHECK = [
  'content-length',
  'etag',
  'last-modified',
];

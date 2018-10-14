/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

export const DB_VERSION = 2;
export const DB_NAME = 'workbox-background-sync';
export const OBJECT_STORE_NAME = 'requests';
export const INDEXED_PROP = 'queueName';
export const TAG_PREFIX = 'workbox-background-sync';
export const MAX_RETENTION_TIME = 60 * 24 * 7; // 7 days in minutes

/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import '../_version.mjs';

export const CACHE_UPDATED_MESSAGE_TYPE = 'CACHE_UPDATED';
export const CACHE_UPDATED_MESSAGE_META = 'workbox-broadcast-cache-update';
export const DEFAULT_BROADCAST_CHANNEL_NAME = 'workbox';
export const DEFAULT_DEFER_NOTIFICATION_TIMEOUT = 10000;
export const DEFAULT_HEADERS_TO_CHECK = [
  'content-length',
  'etag',
  'last-modified',
];

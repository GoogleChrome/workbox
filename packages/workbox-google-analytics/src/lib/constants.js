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

export default {
  CACHE_NAME: 'offline-google-analytics',
  IDB: {
    NAME: 'offline-google-analytics',
    STORE: 'urls',
    VERSION: 1,
  },
  MAX_ANALYTICS_BATCH_SIZE: 20,
  STOP_RETRYING_AFTER: 1000 * 60 * 60 * 48, // Two days, in milliseconds.
  URL: {
    ANALYTICS_JS_PATH: '/analytics.js',
    COLLECT_PATH: '/collect',
    HOST: 'www.google-analytics.com',
  },
};

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

module.exports = `Usage:
$ workbox command path/to/workbox-config.js
  
Arguments:
  command  Can be one of:
           - wizard: Runs the configuration wizard, which will generate a config
             file based on your local build environment.
           - generateSW: Creates a new service worker file based on the
             options in the config file. See https://goo.gl/zQz4By
           - injectManifest: Takes an existing service worker file as a
             starting point and creates a service worker file with precaching
             manifest "injected", based on the options in the config file.
             See https://goo.gl/yB6KZL

  path/to/workbox-config.js  In 'wizard' mode, this will be used as the
                             destination for saving your configuration.
                             In 'generateSW' or 'injectManifest' mode, it should
                             be an existing file, in CommonJS module format.
                             The exported object's properties should follow
                             https://goo.gl/YYPcyY

Examples:
  $ workbox wizard new-workbox-config.js
  $ workbox generateSW workbox-config.js
  $ workbox injectManifest config/workbox-config.js
`;

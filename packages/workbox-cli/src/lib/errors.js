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

const ol = require('common-tags').oneLine;

module.exports = {
  'missing-command-param': `Please provide a command.`,
  'missing-config-file-param': `Please provide a configuration file.`,
  'missing-dest-dir-param': ol`Please provide the path to a directory in which
    the libraries will be copied.`,
  'invalid-common-js-module': ol`Please pass in a valid CommonJS module that
    exports your configuration.`,
  'config-validation-failed': `Your configuration is invalid:`,
  'workbox-build-runtime-error': `Service worker generation failed:`,
  'unknown-command': `Unknown command:`,
  'no-file-extensions-found': ol`No files could be found that are suitable for
    caching.`,
  'no-file-extensions-selected': `Please select at least one file extension.`,
  'invalid-sw-dest': ol`Please enter a valid path to use for the service worker
    file that's created.`,
  'glob-directory-invalid': ol`The path you entered isn't a valid directory.`,
  'invalid-config-location': ol`Please enter a valid path to use for the saved
    configuration file.`,
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {oneLine as ol} from 'common-tags';

export const errors = {
  'missing-input': `params.input value was not set properly.`,
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
  'sw-src-missing-injection-point': ol`That is not a valid source service worker
    file. Please try again with a file containing
    'self.__WB_MANIFEST'.`,
  'no-search-parameters-supplied': ol`Please provide the url search param(s)
    you would like to ignore.`,
  'invalid-search-parameters-supplied': ol`Please provide the valid URL search parameter(s)
    without the leading '/' or '?' (i.e. source,version,language).`,
};

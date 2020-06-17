"use strict";
/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = void 0;
const common_tags_1 = require("common-tags");
exports.errors = {
    'missing-input': `params.input value was not set properly.`,
    'missing-dest-dir-param': common_tags_1.oneLine `Please provide the path to a directory in which
    the libraries will be copied.`,
    'invalid-common-js-module': common_tags_1.oneLine `Please pass in a valid CommonJS module that
    exports your configuration.`,
    'config-validation-failed': `Your configuration is invalid:`,
    'workbox-build-runtime-error': `Service worker generation failed:`,
    'unknown-command': `Unknown command:`,
    'no-file-extensions-found': common_tags_1.oneLine `No files could be found that are suitable for
    caching.`,
    'no-file-extensions-selected': `Please select at least one file extension.`,
    'invalid-sw-dest': common_tags_1.oneLine `Please enter a valid path to use for the service worker
    file that's created.`,
    'glob-directory-invalid': common_tags_1.oneLine `The path you entered isn't a valid directory.`,
    'invalid-config-location': common_tags_1.oneLine `Please enter a valid path to use for the saved
    configuration file.`,
    'sw-src-missing-injection-point': common_tags_1.oneLine `That is not a valid source service worker
    file. Please try again with a file containing
    'self.__WB_MANIFEST'.`,
};

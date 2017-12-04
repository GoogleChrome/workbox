/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const copyWorkboxLibraries = require('./lib/copy-workbox-libraries');
const generateSW = require('./entry-points/generate-sw');
const generateSWString = require('./entry-points/generate-sw-string');
const getManifest = require('./entry-points/get-manifest');
const injectManifest = require('./entry-points/inject-manifest');
const {getModuleUrl} = require('./lib/cdn-utils');

/**
 * This Node module can be used to generate a list of assets that should be
 * precached in a service worker, generating a hash that can be used to
 * intelligently update a cache when the service worker is updated.
 *
 * This module will use glob patterns to find assets in a given directory
 * and use the resulting URL and revision data for one of the follow uses:
 *
 * 1. Generate a complete service worker with precaching and some basic
 * configurable options, writing the resulting service worker file to disk. See
 * [generateSW()]{@link module:workbox-build.generateSW}.
 * 1. Generate a complete service worker with precaching and some basic
 * configurable options, without writing the results to disk. See
 * [generateSWString()]{@link module:workbox-build.generateSWString}.
 * 1. Inject a manifest into an existing service worker. This allows you
 * to control your own service worker while still taking advantage of
 * [workboxSW.precache()]{@link module:workbox-sw.WorkboxSW#precache} logic.
 * See [injectManifest()]{@link module:workbox-build.injectManifest}.
 * 1. Just generate a manifest, not a full service worker file.
 * This is useful if you want to make use of the manifest from your own existing
 * service worker file and are okay with including the manifest yourself.
 * See [getManifest()]{@link module:workbox-build.getManifest}.
 *
 * @module workbox-build
 */

module.exports = {
  copyWorkboxLibraries,
  generateSW,
  generateSWString,
  getManifest,
  getModuleUrl,
  injectManifest,
};

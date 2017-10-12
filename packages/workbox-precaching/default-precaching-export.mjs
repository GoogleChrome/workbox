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

import PrecacheController from './controllers/PrecacheController.mjs';
import './_version.mjs';

const precacheController = new PrecacheController();
let listenersAdded = false;

const addListeners = () => {
  listenersAdded = true;
  self.addEventListener('install', (event) => {
    event.waitUntil(precacheController.install());
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(precacheController.cleanup());
  });
};

/**
 * This method will add items to the precache list, removing duplicates
 * and ensuring the information is valid.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 *
 * @alias module:workbox-precaching.precache
 */
const precache = (entries) => {
  precacheController.addToCacheList(entries);

  if (entries.length > 0 && !listenersAdded) {
    addListeners();
  }
};

export default {
  precache,
};

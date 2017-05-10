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

/* eslint-env worker, serviceworker */

import IDBHelper from '../../../../lib/idb-helper.js';
import constants from './constants.js';

const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
  constants.IDB.STORE);

/**
 * Adds a URL to IndexedDB, along with the current timestamp.
 *
 * If the request has a body, that body will be used as the URL's search
 * parameters when saving the URL to IndexedDB.
 *
 * If no `time` parameter is provided, Date.now() will be used.
 *
 * @private
 * @param {Request} request
*  @param {Number} [time]
 * @return {Promise.<T>} A promise that resolves when IndexedDB is updated.
 */
export default (request, time) => {
  const url = new URL(request.url);
  return request.text().then((body) => {
    // If there's a request body, then use it as the URL's search value.
    // This is most likely because the original request was an HTTP POST
    // that uses the beacon transport.
    if (body) {
      url.search = body;
    }

    return idbHelper.put(url.toString(), time || Date.now());
  });
};

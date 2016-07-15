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

const IDBHelper = require('../../../../lib/idb-helper.js');
const constants = require('./constants.js');

const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
  constants.IDB.STORE);

/**
 * Replays all the queued requests found in IndexedDB, by calling fetch()
 * with an additional parameter indicating the offset from the original time.
 *
 * Returns a promise that resolves when the replaying is complete.
 *
 * @private
 * @returns {Promise.<T>}
 */
module.exports = () => {
  return idbHelper.getAllKeys().then(urls => {
    return Promise.all(urls.map(url => {
      return idbHelper.get(url).then(queuedTime => {
        return fetch(`${url}&qt=${queuedTime}`).catch(error => {
          // If this was queued recently, then rethrow the error, to prevent
          // the entry from being deleted. It will be retried again later.
          if ((Date.now() - queuedTime) < constants.STOP_RETRYING_AFTER) {
            throw error;
          }
        });
      }).then(() => idbHelper.delete(url));
    }));
  });
};

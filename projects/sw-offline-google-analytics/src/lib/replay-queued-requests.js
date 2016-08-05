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
const log = require('../../../../lib/log.js');

const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
  constants.IDB.STORE);

/**
 * Replays all the queued requests found in IndexedDB, by calling fetch()
 * with an additional parameter indicating the offset from the original time.
 *
 * Returns a promise that resolves when the replaying is complete.
 *
 * @private
 * @param {Object=} additionalParameters URL parameters, expressed as key/value
 *                 pairs, to be added to replayed Google Analytics requests.
 *                 This can be used to, e.g., set a custom dimension indicating
 *                 that the request was replayed from the service worker.
 * @returns {Promise.<T>}
 */
module.exports = additionalParameters => {
  additionalParameters = additionalParameters || {};

  return idbHelper.getAllKeys().then(urls => {
    return Promise.all(urls.map(url => {
      return idbHelper.get(url).then(hitTime => {
        const queueTime = Date.now() - hitTime;
        const newUrl = new URL(url);

        // URLSearchParams was added in Chrome 49.
        // On the off chance we're on a browser that lacks support, we won't
        // set additionParameters, but at least we'll set qt=.
        if ('searchParams' in newUrl) {
          additionalParameters.qt = queueTime;
          // Call sort() on the keys so that there's a reliable order of calls
          // to searchParams.set(). This isn't important in terms of
          // functionality, but it will make testing easier, since the
          // URL serialization depends on the order in which .set() is called.
          Object.keys(additionalParameters).sort().forEach(parameter => {
            newUrl.searchParams.set(parameter, additionalParameters[parameter]);
          });
        } else {
          log('The browser does not support URLSearchParams, ' +
            'so not setting additional parameters.');
          newUrl.search += (newUrl.search ? '&' : '') + 'qt=' + queueTime;
        }

        return fetch(newUrl.toString()).catch(error => {
          // If this was queued recently, then rethrow the error, to prevent
          // the entry from being deleted. It will be retried again later.
          if ((Date.now() - queueTime) < constants.STOP_RETRYING_AFTER) {
            throw error;
          }
        });
      }).then(() => idbHelper.delete(url));
    }));
  });
};

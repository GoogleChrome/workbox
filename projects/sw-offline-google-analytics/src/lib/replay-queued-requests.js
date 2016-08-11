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
 * @param {Object=} parameterOverrides URL parameters, expressed as key/value
 *                 pairs, to be added to replayed Google Analytics requests.
 *                 This can be used to, e.g., set a custom dimension indicating
 *                 that the request was replayed from the service worker.
 * @returns {Promise.<T>}
 */
module.exports = ({parameterOverrides = {}, hitFilter} = {}) => {
  return idbHelper.getAllKeys().then(urls => {
    return Promise.all(urls.map(url => {
      return idbHelper.get(url).then(hitTime => {
        const queueTime = Date.now() - hitTime;
        const newUrl = new URL(url);

        // Do not attempt to replay hits that are too old.
        if (queueTime > constants.STOP_RETRYING_AFTER) return;

        // Do not attempt to replay hits in browsers without URLSearchParams support.
        if (!('searchParams' in newUrl)) return;

        parameterOverrides.qt = queueTime;

        // Call sort() on the keys so that there's a reliable order of calls
        // to searchParams.set(). This isn't important in terms of
        // functionality, but it will make testing easier, since the
        // URL serialization depends on the order in which .set() is called.
        Object.keys(parameterOverrides).sort().forEach(parameter => {
          newUrl.searchParams.set(parameter, parameterOverrides[parameter]);
        });

        // If the hitFilter config option was passed and is a function,
        // invoke it with searchParams as its argument allowing the function
        // to modify the hit prior to sending it. The function can also
        // throw an error to abort the hit if needed.
        if (typeof hitFilter === 'function') {
          try {
            hitFilter(newUrl.searchParams);
          } catch (err) {
            return;
          }
        }

        return fetch(newUrl.toString());
      }).then(() => idbHelper.delete(url));
    }));
  });
};

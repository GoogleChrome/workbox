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
 * Replays all the queued requests found in IndexedDB, by calling fetch()
 * with an additional parameter indicating the offset from the original time.
 *
 * Returns a promise that resolves when the replaying is complete.
 *
 * @private
 * @param {Object=}   config Optional configuration arguments.
 * @param {Object=}   config.parameterOverrides Optional
 *                    [Measurement Protocol parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters),
 *                    expressed as key/value pairs, to be added to replayed
 *                    Google Analytics requests. This can be used to, e.g., set
 *                    a custom dimension indicating that the request was
 *                    replayed.
 * @param {Function=} config.hitFilter Optional
 *                    A function that allows you to modify the hit parameters
 *                    prior to replaying the hit. The function is invoked with
 *                    the original hit's URLSearchParams object as its only
 *                    argument. To abort the hit and prevent it from being
 *                    replayed, throw an error.
 * @return {Promise.<T>}
 */
 export default (config) => {
  config = config || {};

  return idbHelper.getAllKeys().then((urls) => {
    return Promise.all(urls.map((url) => {
      return idbHelper.get(url).then((hitTime) => {
        const queueTime = Date.now() - hitTime;
        const newUrl = new URL(url);

        // Do not attempt to replay hits that are too old.
        if (queueTime > constants.STOP_RETRYING_AFTER) {
          return;
        }

        // Do not attempt to replay hits in browsers without
        // URLSearchParams support.
        if (!('searchParams' in newUrl)) {
          return;
        }

        let parameterOverrides = config.parameterOverrides || {};
        parameterOverrides.qt = queueTime;

        // Call sort() on the keys so that there's a reliable order of calls
        // to searchParams.set(). This isn't important in terms of
        // functionality, but it will make testing easier, since the
        // URL serialization depends on the order in which .set() is called.
        Object.keys(parameterOverrides).sort().forEach((parameter) => {
          newUrl.searchParams.set(parameter, parameterOverrides[parameter]);
        });

        // If the hitFilter config option was passed and is a function,
        // invoke it with searchParams as its argument allowing the function
        // to modify the hit prior to sending it. The function can also
        // throw an error to abort the hit if needed.
        let hitFilter = config.hitFilter;
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

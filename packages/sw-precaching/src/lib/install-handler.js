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

import ErrorFactory from './error-factory';
import IDBHelper from '../../../../lib/idb-helper.js';
import {version, defaultCacheId, DB_NAME, DB_VERSION, DB_STORENAME}
  from './constants';

const getPreviousRevisionDetails = (idbHelper, path) => {
  return idbHelper.get(path);
};

const addAssetHashToIndexedDB = (idbHelper, assetAndHash) => {
  return idbHelper.put(assetAndHash.path, assetAndHash.revision);
};

const installHandler = ({assetsAndHahes, cacheId} = {}) => {
  if (!Array.isArray(assetsAndHahes)) {
    throw ErrorFactory.createError('assets-not-an-array');
  }

  const cacheName =
    `${cacheId || defaultCacheId}-${version}-${self.registration.scope}`;
  const idbHelper = new IDBHelper(DB_NAME, DB_VERSION, DB_STORENAME);

  return caches.open(cacheName)
  .then((openCache) => {
    const cachePromises = assetsAndHahes.map((assetAndHash) => {
      return getPreviousRevisionDetails(idbHelper, assetAndHash.path)
      .then((previousRevisionDetails) => {
        if (previousRevisionDetails) {
          if (previousRevisionDetails === assetAndHash.revision) {
            /* eslint-disable no-console */
            console.log('    Already Cached? TODO: Need to check cache to ' +
              'ensure it\'s actually already cached.');
            /* eslint-enable no-console */
            return Promise.resolve();
          }
        }

        return Promise.all([
          addAssetHashToIndexedDB(idbHelper, assetAndHash),
          openCache.add(new Request(assetAndHash.path, {
            credentials: 'same-origin',
          })),
        ]);
      });
    });
    return Promise.all(cachePromises)
    .then(() => {
      return openCache.keys();
    })
    .then((openCacheKeys) => {
      const urlsCachedOnInstall = assetsAndHahes.map((assetAndHash) => {
        return assetAndHash.path;
      });

      const cacheDeletePromises = openCacheKeys.map((cachedRequest) => {
        if (!urlsCachedOnInstall.includes(cachedRequest.url)) {
          return openCache.delete(cachedRequest);
        }
        return Promise.resolve();
      });
      return Promise.all(cacheDeletePromises);
    });
  });
};

export default installHandler;

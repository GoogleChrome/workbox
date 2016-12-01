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
<<<<<<< HEAD
import {defaultCacheName, dbName, dbVersion, dbStorename}
  from './constants';

const getPreviousRevisionDetails = () => {
  console.warn('getPreviousRevisionDetails always returns null.');
  return Promise.resolve(null);
=======
import {version, defaultCacheId, DB_NAME, DB_VERSION, DB_STORENAME}
  from './constants';

const getPreviousRevisionDetails = (idbHelper, path) => {
  return idbHelper.get(path);
>>>>>>> e497c07936d4652641b6f86853d8c72631252d05
};

const addAssetHashToIndexedDB = (idbHelper, assetAndHash) => {
  return idbHelper.put(assetAndHash.path, assetAndHash.revision);
};

const installHandler = async ({assetsAndHahes, cacheId} = {}) => {
  if (!Array.isArray(assetsAndHahes)) {
    throw ErrorFactory.createError('assets-not-an-array');
  }

<<<<<<< HEAD
  const cacheName = cacheId || defaultCacheName;
  const idbHelper = new IDBHelper(dbName, dbVersion, dbStorename);

  const openCache = await caches.open(cacheName);
  const cachePromises = assetsAndHahes.map((assetAndHash) => {
    return getPreviousRevisionDetails(assetAndHash.path)
    .then((previousRevisionDetails) => {
      if (previousRevisionDetails) {
        console.warn('Need to handle previous revision details');
        return Promise.resolve();
      }

      return openCache.add(new Request(assetAndHash.path, {
        credentials: 'same-origin',
      }))
      .then(() => {
        return addAssetHashToIndexedDB(idbHelper, assetAndHash);
      });
    });
  });

  return Promise.all(cachePromises);
=======
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
>>>>>>> e497c07936d4652641b6f86853d8c72631252d05
};

export default installHandler;

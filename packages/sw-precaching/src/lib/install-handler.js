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
import {version, defaultCacheId, DB_NAME, DB_VERSION, DB_STORENAME} from './constants';

const getCurrentlyCachedUrls = (cache) => {
  return cache.keys()
    .then((requests) => {
      return requests.map((request) => request.url);
    });
};

/** const createRevisionedUrl = (assetAndHash) => {
  const absoluteUrl = new URL(assetAndHash.path, self.location);
  absoluteUrl.search += (absoluteUrl.search ? '&' : '') +
    encodeURIComponent(hashParamName) + '=' +
    encodeURIComponent(assetAndHash.revision);
  return absoluteUrl.toString();
};**/

const getPathsOnly = (assetsAndHahes) => {
  return assetsAndHahes.map((assetAndHash) => {
    let assetUrl = assetAndHash;

    if (typeof assetAndHash !== 'string') {
      // Asset is an object with {path: '', revision: ''}
      assetUrl = assetAndHash.path; // createRevisionedUrl(assetAndHash);
    }
    return assetUrl;
  });
};

const getPreviousRevisionDetails = () => {
  console.warn('getPreviousRevisionDetails always returns null.');
  return Promise.resolve(null);
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
      console.log('Caching: ', assetAndHash);
      return getPreviousRevisionDetails(assetAndHash.path)
      .then((previousRevisionDetails) => {
        if (previousRevisionDetails) {
          console.warn('Need to handle previous revision detilas');
          return Promise.resolve();
        }

        console.log('caching response.');
        return Promise.all([
          addAssetHashToIndexedDB(idbHelper, assetAndHash),
          openCache.add(new Request(assetAndHash.path, {
            credentials: 'same-origin',
          })),
        ]);
      });
    });
    return Promise.all(cachePromises);
  });

  /**
  return caches.open(cacheName)
  .then((cache) => {
    return getCurrentlyCachedUrls(cache)
    .then((cachedUrls) => {
      const cacheAddPromises = assetsAndHahes.map(({path, revision}) => {
        if (cachedUrls.includes(path)) {
          // TODO: Check the file revision matches.
          return Promise.resolve();
        }

        return cache.add(new Request(path, {
          credentials: 'same-origin',
        }));
      });

      return Promise.all(cacheAddPromises);
    })
    .then(() => {
      // All cached assets are cached, we now need to remove any remaining
      // cached assets
    });
  });
  **/
};

export default installHandler;

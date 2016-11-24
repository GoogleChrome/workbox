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
import {version, defaultCacheId, hashParamName} from './constants';

const getCachedUrls = (cache) => {
  return cache.keys()
    .then((requests) => {
      return requests.map((request) => request.url);
    });
};

const createRevisionedUrl = (assetAndHash) => {
  const absoluteUrl = new URL(assetAndHash.path, self.location);
  absoluteUrl.search += (absoluteUrl.search ? '&' : '') +
    encodeURIComponent(hashParamName) + '=' +
    encodeURIComponent(assetAndHash.revision);
  return absoluteUrl.toString();
};

const parseToRevisionedUrls = (assetsAndHahes) => {
  return assetsAndHahes.map((assetAndHash) => {
    let assetUrl = assetAndHash;

    if (typeof assetAndHash !== 'string') {
      // Asset is an object with {path: '', revision: ''}
      assetUrl = createRevisionedUrl(assetAndHash);
    }

    return assetUrl;
  });
};

const installHandler = ({assetsAndHahes, cacheId} = {}) => {
  if (!Array.isArray(assetsAndHahes)) {
    throw ErrorFactory.createError('assets-not-an-array');
  }

  const cacheName =
    `${cacheId || defaultCacheId}-${version}-${self.registration.scope}`;
  const revisionedUrls = parseToRevisionedUrls(assetsAndHahes);

  return caches.open(cacheName)
  .then((cache) => {
    return getCachedUrls(cache)
    .then((cachedUrls) => {
      const cacheAddPromises = revisionedUrls.map((revisionedUrl) => {
        if (cachedUrls.includes(revisionedUrl)) {
          return Promise.resolve();
        }

        return cache.add(new Request(revisionedUrl, {
          credentials: 'same-origin',
        }));
      });

      return Promise.all(cacheAddPromises);
    });
  });
};

export default installHandler;

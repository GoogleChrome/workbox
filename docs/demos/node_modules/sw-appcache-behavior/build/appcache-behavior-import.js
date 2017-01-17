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
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.goog = global.goog || {}, global.goog.appCacheBehavior = global.goog.appCacheBehavior || {})));
}(this, (function (exports) { 'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var idb = createCommonjsModule(function (module) {
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  {
    module.exports = exp;
  }
}());
});

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

/**
 * A wrapper to store for an IDB connection to a particular ObjectStore.
 *
 * @private
 */
class IDBHelper {
  constructor(name, version, storeName) {
    if (name == undefined || version == undefined || storeName == undefined) {
      throw Error('name, version, storeName must be passed to the ' +
        'constructor.');
    }

    this._name = name;
    this._version = version;
    this._storeName = storeName;
  }

  /**
   * Returns a promise that resolves with an open connection to IndexedDB,
   * either existing or newly opened.
   *
   * @private
   * @return {Promise<DB>}
   */
  _getDb() {
    if (this._dbPromise) {
      return this._dbPromise;
    }

    this._dbPromise = idb.open(this._name, this._version, (upgradeDB) => {
      upgradeDB.createObjectStore(this._storeName);
    })
    .then((db) => {
      return db;
    });

    return this._dbPromise;
  }

  close() {
    if (!this._dbPromise) {
      return;
    }

    return this._dbPromise
    .then((db) => {
      db.close();
      this._dbPromise = null;
    });
  }

  /**
   * Wrapper on top of the idb wrapper, which simplifies saving the key/value
   * pair to the object store.
   * Returns a Promise that fulfills when the transaction completes.
   *
   * @private
   * @param {String} key
   * @param {Object} value
   * @return {Promise<T>}
   */
  put(key, value) {
    return this._getDb().then((db) => {
      const tx = db.transaction(this._storeName, 'readwrite');
      const objectStore = tx.objectStore(this._storeName);
      objectStore.put(value, key);
      return tx.complete;
    });
  }

  /**
   * Wrapper on top of the idb wrapper, which simplifies deleting an entry
   * from the object store.
   * Returns a Promise that fulfills when the transaction completes.
   *
   * @private
   * @param {String} key
   * @return {Promise<T>}
   */
  delete(key) {
    return this._getDb().then((db) => {
      const tx = db.transaction(this._storeName, 'readwrite');
      const objectStore = tx.objectStore(this._storeName);
      objectStore.delete(key);
      return tx.complete;
    });
  }

  /**
   * Wrapper on top of the idb wrapper, which simplifies getting a key's value
   * from the object store.
   * Returns a promise that fulfills with the value.
   *
   * @private
   * @param {String} key
   * @return {Promise<Object>}
   */
  get(key) {
    return this._getDb().then((db) => {
      return db.transaction(this._storeName)
        .objectStore(this._storeName)
        .get(key);
    });
  }

  /**
   * Wrapper on top of the idb wrapper, which simplifies getting all the values
   * in an object store.
   * Returns a promise that fulfills with all the values.
   *
   * @private
   * @return {Promise<Array<Object>>}
   */
  getAllValues() {
    return this._getDb().then((db) => {
      return db.transaction(this._storeName)
        .objectStore(this._storeName)
        .getAll();
    });
  }

  /**
   * Wrapper on top of the idb wrapper, which simplifies getting all the keys
   * in an object store.
   * Returns a promise that fulfills with all the keys.
   *
   * @private
   * @param {String} storeName
   * @return {Promise<Array<Object>>}
   */
  getAllKeys() {
    return this._getDb().then((db) => {
      return db.transaction(this._storeName)
        .objectStore(this._storeName)
        .getAllKeys();
    });
  }
}

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

/* eslint-disable no-console */

var log = () => {
  // Evaluate goog.DEBUG at runtime rather than once at export time to allow
  // developers to enable logging "on-the-fly" by setting `goog.DEBUG = true`
  // in the JavaScript console.
  return (self && self.goog && self.goog.DEBUG) ?
    console.debug.bind(console) :
    function() {};
};

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

var constants = {
  DB_NAME: 'appcache-to-service-worker',
  DB_VERSION: 1,
  STORES: {
    CLIENT_ID_TO_HASH: 'client-to-hash',
    MANIFEST_URL_TO_CONTENTS: 'manifest-url-to-contents',
    PATH_TO_MANIFEST: 'path-to-manifest',
  },
};

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

const idbHelpers = {};
Object.keys(constants.STORES).forEach((storeId) => {
  idbHelpers[constants.STORES[storeId]] = new IDBHelper(
    constants.DB_NAME, constants.DB_VERSION, constants.STORES[storeId]);
});

/**
 * Determines what the most likely URL is associated with the client page from
 * which the event's request originates. This is used to determine which
 * AppCache manifest's rules should be applied.
 *
 * @private
 * @param {FetchEvent} event
 * @return {Promise.<String>} The client URL
 */
function getClientUrlForEvent(event) {
  // If our service worker implementation supports client identifiers, try
  // to get the client URL using that.
  return self.clients.get(event.clientId)
    .then((client) => client.url)
    // If those aren't supported, .catch() any errors and try something else.
    .catch((error) => {
      log('Error while using clients.get(event.clientId).url: ' + error);
      // Firefox currently sets the referer to 'about:client' for initial
      // navigations, but that's not useful for our purposes.
      if (event.request.referrer &&
          event.request.referrer !== 'about:client') {
        return event.request.referrer;
      }

      // Use the event's request URL as the last resort, with the assumption
      // that this is a navigation request.
      return event.request.url;
    });
}

/**
 * Finds the longest matching prefix, given an array of possible matches.
 *
 * @private
 * @param {Array.<String>} urlPrefixes
 * @param {String} fullUrl
 * @return {String} The longest matching prefix, or '' if none match
 */
function longestMatchingPrefix(urlPrefixes, fullUrl) {
  return urlPrefixes
    .filter((urlPrefix) => fullUrl.startsWith(urlPrefix))
    .reduce((longestSoFar, current) => {
      return longestSoFar.length >= current.length ? longestSoFar : current;
    }, '');
}

/**
 * Performs a fetch(), using a cached response as a fallback if that fails.
 *
 * @private
 * @param {Request} request
 * @param {String} fallbackUrl
 * @param {String} cacheName
 * @return {Promise.<Response>}
 */
function fetchWithFallback(request, fallbackUrl, cacheName) {
  log('Trying fetch for', request.url);
  return fetch(request).then((response) => {
    // Succesful but error-like responses are treated as failures.
    // Ditto for redirects to other origins.
    if (!response.ok || (new URL(response.url).origin !== location.origin)) {
      throw Error('Fallback request failure.');
    }
    return response;
  }).catch(() => {
    log('fetch() failed. Falling back to cache of', fallbackUrl);
    return caches.open(cacheName).then(
      (cache) => cache.match(fallbackUrl));
  });
}

/**
 * Checks IndexedDB for a manifest with a given URL. If found, it fulfills
 * with info about the latest version.
 *
 * @private
 * @param {String} manifestUrl
 * @return {Promise.<Object>}
 */
function getLatestManifestVersion(manifestUrl) {
  return idbHelpers[constants.STORES.MANIFEST_URL_TO_CONTENTS].get(manifestUrl)
    .then((versions) => {
      if (versions && versions.length) {
        return versions[versions.length - 1];
      }
    });
}

/**
 * Checks IndexedDB for a manifest with a given URL, versioned with the
 * given hash. If found, it fulfills with the parsed manifest.
 *
 * @private
 * @param {String} manifestUrl
 * @param {String} manifestHash
 * @return {Promise.<Object>}
 */
function getParsedManifestVersion(manifestUrl, manifestHash) {
  return idbHelpers[constants.STORES.MANIFEST_URL_TO_CONTENTS].get(manifestUrl)
    .then((versions) => {
      versions = versions || [];
      log('versions is', versions);
      return versions.reduce((result, current) => {
        log('current is', current);
        // If we already have a result, just keep returning it.
        if (result) {
          log('result is', result);
          return result;
        }

        // Otherwise, check to see if the hashes match. If so, use the parsed
        // manifest for the current entry as the result.
        if (current.hash === manifestHash) {
          log('manifestHash match', current);
          return current.parsed;
        }

        return null;
      }, null);
    });
}

/**
 * Updates the CLIENT_ID_TO_HASH store in IndexedDB with the client id to
 * hash association.
 *
 * @private
 * @param {String} clientId
 * @param {String} hash
 * @return {Promise.<T>}
 */
function saveClientIdAndHash(clientId, hash) {
  if (clientId) {
    return idbHelpers[constants.STORES.CLIENT_ID_TO_HASH].put(clientId, hash);
  }

  // Return a fulfilled Promise so that we can still call .then().
  return Promise.resolve();
}

/**
 * Implements the actual AppCache logic, given a specific manifest and hash
 * used as a cache identifier.
 *
 * @private
 * @param {FetchEvent} event
 * @param {Object} manifest
 * @param {String} hash
 * @param {String} clientUrl
 * @return {Promise.<Response>}
 */
function appCacheLogic(event, manifest, hash, clientUrl) {
  log('manifest is', manifest, 'version is', hash);
  const requestUrl = event.request.url;

  // Is our request URL listed in the CACHES section?
  // Or is our request URL the client URL, since any page that
  // registers a manifest is treated as if it were in the CACHE?
  if (manifest.cache.includes(requestUrl) || requestUrl === clientUrl) {
    log('CACHE includes URL; using cache.match()');
    // If so, return the cached response.
    return caches.open(hash).then((cache) => cache.match(requestUrl));
  }

  // Otherwise, check the FALLBACK section next.
  // FALLBACK keys are URL prefixes, and if more than one prefix
  // matches our request URL, the longest prefix "wins".
  // (Of course, it might be that none of the prefixes match.)
  const fallbackKey = longestMatchingPrefix(Object.keys(manifest.fallback),
    requestUrl);
  if (fallbackKey) {
    log('fallbackKey in parsedManifest matches', fallbackKey);
    return fetchWithFallback(event.request, manifest.fallback[fallbackKey],
      hash);
  }

  // If CACHE and FALLBACK don't apply, try NETWORK.
  if (manifest.network.includes(requestUrl) ||
      manifest.network.includes('*')) {
    log('Match or * in NETWORK; using fetch()');
    return fetch(event.request);
  }

  // If nothing matches, then return an error response.
  log('Nothing matches; using Response.error()');
  return Response.error();
}

/**
 * The behavior when there's a matching manifest for our client URL.
 *
 * @private
 * @param {FetchEvent} event
 * @param {String} manifestUrl
 * @param {String} clientUrl
 * @return {Promise.<Response>}
 */
function manifestBehavior(event, manifestUrl, clientUrl) {
  if (event.clientId) {
    return idbHelpers[constants.STORES.CLIENT_ID_TO_HASH].get(event.clientId)
      .then((hash) => {
        // If we already have a hash assigned to this client id, use that
        // manifest to implement the AppCache logic.
        if (hash) {
          return getParsedManifestVersion(manifestUrl, hash)
            .then((parsedManifest) => appCacheLogic(event, parsedManifest, hash,
              clientUrl));
        }

        // If there's isn't yet a hash for this client id, then get the latest
        // version of the manifest, and use that to implement AppCache logic.
        // Also, establish the client id to hash mapping for future use.
        return getLatestManifestVersion(manifestUrl).then((latest) => {
          return saveClientIdAndHash(event.clientId, latest.hash)
            .then(() => appCacheLogic(event, latest.parsed, latest.hash,
              clientUrl));
        });
      });
  }

  // If there's no client id, then just use the latest version of the
  // manifest to implement AppCache logic.
  return getLatestManifestVersion(manifestUrl).then(
    (latest) => appCacheLogic(event, latest.parsed, latest.hash, clientUrl));
}

/**
 * The behavior when there is no matching manifest for our client URL.
 *
 * @private
 * @param {FetchEvent} event
 * @return {Promise.<Response>}
 */
function noManifestBehavior(event) {
  // If we fall through to this point, then we don't have a known
  // manifest associated with the client making the request.
  // We now need to check to see if our request URL matches a prefix
  // from the FALLBACK section of *any* manifest in our origin. If
  // there are multiple matches, the longest prefix wins. If there are
  // multiple prefixes of the same length in different manifest, then
  // the one returned last from IDB wins. (This might not match
  // browser behavior.)
  // See https://www.w3.org/TR/2011/WD-html5-20110525/offline.html#concept-appcache-matches-fallback
  return idbHelpers[constants.STORES.MANIFEST_URL_TO_CONTENTS].getAllValues()
    .then((manifests) => {
      log('All manifests:', manifests);
      // Use .map() to create an array of the longest matching prefix
      // for each manifest. If no prefixes match for a given manifest,
      // the value will be ''.
      const longestForEach = manifests.map((manifestVersions) => {
        // Use the latest version of a given manifest.
        const parsedManifest =
          manifestVersions[manifestVersions.length - 1].parsed;
        return longestMatchingPrefix(
          Object.keys(parsedManifest.fallback), event.request.url);
      });
      log('longestForEach:', longestForEach);

      // Next, find which of the longest matching prefixes from each
      // manifest is the longest overall. Return both the index of the
      // manifest in which that match appears and the prefix itself.
      const longest = longestForEach.reduce((soFar, current, i) => {
        if (current.length >= soFar.prefix.length) {
          return {prefix: current, index: i};
        }

        return soFar;
      }, {prefix: '', index: 0});
      log('longest:', longest);

      // Now that we know the longest overall prefix, we'll use that
      // to lookup the fallback URL value in the winning manifest.
      const fallbackKey = longest.prefix;
      log('fallbackKey:', fallbackKey);
      if (fallbackKey) {
        const winningManifest = manifests[longest.index];
        log('winningManifest:', winningManifest);
        const winningManifestVersion =
          winningManifest[winningManifest.length - 1];
        log('winningManifestVersion:', winningManifestVersion);
        const hash = winningManifestVersion.hash;
        const parsedManifest = winningManifestVersion.parsed;
        return fetchWithFallback(event.request,
          parsedManifest.fallback[fallbackKey], hash);
      }

      // If nothing matches, then just fetch().
      log('Nothing at all matches. Using fetch()');
      return fetch(event.request);
    });
}

/**
 * An attempt to mimic AppCache behavior, using the primitives available to
 * a service worker.
 *
 * @private
 * @param {FetchEvent} event
 * @return {Promise.<Response>}
 */
function appCacheBehaviorForEvent(event) {
  const requestUrl = new URL(event.request.url);
  log('Starting appCacheBehaviorForUrl for ' + requestUrl);

  // If this is a request that, as per the AppCache spec, should be handled
  // via a direct fetch(), then do that and bail early.
  if (event.request.headers.get('X-Use-Fetch') === 'true') {
    log('Using fetch() because X-Use-Fetch: true');
    return fetch(event.request);
  }

  // Appcache rules only apply to GETs & same-scheme requests.
  if (event.request.method !== 'GET' ||
      requestUrl.protocol !== location.protocol) {
    log('Using fetch() because AppCache does not apply to this request.');
    return fetch(event.request);
  }

  return getClientUrlForEvent(event).then((clientUrl) => {
    log('clientUrl is', clientUrl);
    return idbHelpers[constants.STORES.PATH_TO_MANIFEST].get(clientUrl)
      .then((manifestUrl) => {
        log('manifestUrl is', manifestUrl);

        if (manifestUrl) {
          return manifestBehavior(event, manifestUrl, clientUrl);
        }

        log('No matching manifest for client found.');
        return noManifestBehavior(event);
      });
  });
}

/**
 * Given a list of client ids that are still active, this:
 * 1. Gets a list of all the client ids in IndexedDB's CLIENT_ID_TO_HASH
 * 2. Filters them to remove the active ones
 * 3. Delete the inactive entries from IndexedDB's CLIENT_ID_TO_HASH
 * 4. For each inactive one, return the corresponding hash association.
 *
 * @private
 * @param {Array.<String>} idsOfActiveClients
 * @return {Promise.<Array.<String>>}
 */
function cleanupClientIdAndHash(idsOfActiveClients) {
  return idbHelpers[constants.STORES.CLIENT_ID_TO_HASH].getAllKeys()
    .then((allKnownIds) => {
      return allKnownIds.filter((id) => !idsOfActiveClients.includes(id));
    }).then((idsOfInactiveClients) => {
      return Promise.all(idsOfInactiveClients.map((id) => {
        const storeName = constants.STORES.CLIENT_ID_TO_HASH;
        return idbHelpers[storeName].get(id).then((hash) => {
          return idbHelpers[constants.STORES.CLIENT_ID_TO_HASH].delete(id)
            .then(() => hash);
        });
      }));
    });
}

/**
 * Fulfills with an array of all the hash ids that correspond to outdated
 * manifest versions.
 *
 * @private
 * @return {Promise.<Array.<String>>}
 */
function getHashesOfOlderVersions() {
  return idbHelpers[constants.STORES.MANIFEST_URL_TO_CONTENTS].getAllValues()
    .then((manifests) => {
      return manifests.map((versions) => {
        // versions.slice(0, -1) will give all the versions other than the
        // last, or [] if there's aren't any older versions.
        return versions.slice(0, -1).map((version) => version.hash);
      }).reduce((prev, curr) => {
        // Flatten the array-of-arrays into an array.
        return prev.concat(curr);
      }, []);
    });
}

/**
 * Does the following:
 * 1. Gets a list of all client ids associated with this service worker.
 * 2. Calls cleanupClientIdAndHash() to remove the out of date client id
 *    to hash associations.
 * 3. Calls getHashesOfOlderVersions() to get a list of all the hashes
 *    that correspond to out-of-date manifest versions.
 * 4. If there's a match between an out of date hash and a hash that is no
 *    longer being used by a client, then it deletes the corresponding cache.
 *
 * @private
 */
function cleanupOldCaches() {
  self.clients.matchAll().then((clients) => {
    return clients.map((client) => client.id);
  }).then((idsOfActiveClients) => {
    return cleanupClientIdAndHash(idsOfActiveClients);
  }).then((hashesNotInUse) => {
    return getHashesOfOlderVersions().then((hashesOfOlderVersions) => {
      return hashesOfOlderVersions.filter((hashOfOlderVersion) => {
        return hashesNotInUse.includes(hashOfOlderVersion);
      });
    });
  }).then((idsToDelete) => {
    log('deleting cache ids', idsToDelete);
    return Promise.all(idsToDelete.map((cacheId) => caches.delete(cacheId)));
  });

  // TODO: Delete the entry in the array stored in MANIFEST_URL_TO_CONTENT.
}

/**
 * `goog.appCacheBehavior.fetch` is the main entry point to the library
 * from within service worker code.
 *
 * The goal of the library is to provide equivalent behavior to AppCache
 * whenever possible. The one difference in how this library behaves compared to
 * a native AppCache implementation is that its client-side code will attempt to
 * fetch a fresh AppCache manifest once any cached version is older than 24
 * hours. This works around a
 * [major pitfall](http://alistapart.com/article/application-cache-is-a-douchebag#section6)
 * in the native AppCache implementation.
 *
 * **Important**
 * In addition to calling `goog.appCacheBehavior.fetch()` from within your
 * service worker, you *must* add the following to each HTML document that
 * contains an App Cache Manifest:
 *
 * ```html
 * <script src="path/to/client-runtime.js"
 *         data-service-worker="service-worker.js">
 * </script>
 * ```
 *
 * (The `data-service-worker` attribute is optional. If provided, it will
 * automatically call
 * [`navigator.serviceWorker.register()`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register)
 * for you.)
 *
 * Once you've added `<script src="path/to/client-runtime.js"></script>` to
 * your HTML pages, you can use `goog.appCacheBehavior.fetch` within your
 * service worker script to get a `Response` suitable for passing to
 * [`FetchEvent.respondWidth()`](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith):
 *
 * ```js
 * // Import the library into the service worker global scope:
 * // https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
 * importScripts('path/to/appcache-behavior-import.js');
 *
 * self.addEventListener('fetch', event => {
 *   event.respondWith(goog.appCacheBehavior.fetch(event).catch(error => {
 *     // Fallback behavior goes here, e.g. return fetch(event.request);
 *   }));
 * });
 * ```
 *
 * `goog.appCacheBehavior.fetch()` can be selectively applied to only a subset
 * of requests, to aid in the migration off of App Cache and onto a more
 * robust service worker implementation:
 *
 * ```js
 * // Import the library into the service worker global scope:
 * // https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
 * importScripts('path/to/appcache-behavior-import.js');
 *
 * self.addEventListener('fetch', event => {
 *   if (event.request.url.match(/legacyRegex/)) {
 *     event.respondWith(goog.appCacheBehavior.fetch(event));
 *   } else {
 *     event.respondWith(goog.appCacheBehavior.fetch(event));
 *   }
 * });
 * ```
 *
 * @alias goog.appCacheBehavior.fetch
 * @param {FetchEvent} event
 * @return {Promise.<Response>}
 */
function fetchBehavior(event) {
  log('client id is', event.clientId);
  return appCacheBehaviorForEvent(event).then((response) => {
    // If this is a navigation, clean up unused caches that correspond to old
    // AppCache manifest versions which are no longer associated with an
    // active client. This will be done asynchronously, and won't block the
    // response from being returned to the onfetch handler.
    if (event.request.mode === 'navigate') {
      cleanupOldCaches();
    }

    return response;
  });
}

exports.fetch = fetchBehavior;

Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=appcache-behavior-import.js.map

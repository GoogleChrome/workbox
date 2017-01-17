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
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.goog = global.goog || {}, global.goog.backgroundSyncQueue = global.goog.backgroundSyncQueue || {}, global.goog.backgroundSyncQueue.test = global.goog.backgroundSyncQueue.test || {}, global.goog.backgroundSyncQueue.test.BackgroundSyncQueue = factory());
}(this, (function () { 'use strict';

const maxAge = 5 * 24 * 60 * 60 * 1000; // 5days
const defaultDBName = 'bgQueueSyncDB';
const broadcastMessageAddedType = 'BACKGROUND_REQUESTED_ADDED';
const broadcastMessageFailedType = 'BACKGROUND_REQUESTED_FAILED';
const defaultQueueName = 'DEFAULT_QUEUE';
const tagNamePrefix = 'SW_BACKGROUND_QUEUE_TAG_';
const broadcastMeta = 'SW_BACKGROUND_SYNC_QUEUE';
const allQueuesPlaceholder = 'QUEUES';

let _dbName = defaultDBName;

function getDbName() {
	return _dbName;
}

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
      throw Error('name, version, storeName must be passed to the ' + 'constructor.');
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

    this._dbPromise = idb.open(this._name, this._version, upgradeDB => {
      upgradeDB.createObjectStore(this._storeName);
    }).then(db => {
      return db;
    });

    return this._dbPromise;
  }

  close() {
    if (!this._dbPromise) {
      return;
    }

    return this._dbPromise.then(db => {
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
    return this._getDb().then(db => {
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
    return this._getDb().then(db => {
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
    return this._getDb().then(db => {
      return db.transaction(this._storeName).objectStore(this._storeName).get(key);
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
    return this._getDb().then(db => {
      return db.transaction(this._storeName).objectStore(this._storeName).getAll();
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
    return this._getDb().then(db => {
      return db.transaction(this._storeName).objectStore(this._storeName).getAllKeys();
    });
  }
}

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

let putResponse = (() => {
	var _ref = asyncToGenerator(function* ({ hash, idbObject, response, idbQDb }) {
		const _idbQHelper = idbQDb;
		idbObject.response = {
			headers: JSON.stringify([...response.headers]),
			status: response.status,
			body: yield response.blob()
		};
		_idbQHelper.put(hash, idbObject);
	});

	return function putResponse(_x) {
		return _ref.apply(this, arguments);
	};
})();

/**
 * takes a request and gives back JSON object that is storable in IDB
 *
 * @param {Request} request request object to transform
 * into iDB storable object
 * @param {Object} config config object to be
 * stored along in the iDB
 * @return {Object} indexable object for iDB
 *
 * @memberOf RequestManager
 */
let getQueueableRequest = (() => {
	var _ref = asyncToGenerator(function* ({ request, config }) {
		let requestObject = {
			config,
			metadata: {
				creationTimestamp: Date.now()
			}
		};
		requestObject.request = {
			url: request.url,
			headers: JSON.stringify([...request.headers]),
			mode: request.mode,
			method: request.method,
			redirect: request.redirect
		};
		const requestBody = yield request.text();
		if (requestBody.length > 0) {
			requestObject.request.body = requestBody;
		}
		return requestObject;
	});

	return function getQueueableRequest(_x) {
		return _ref.apply(this, arguments);
	};
})();

let getFetchableRequest = (() => {
	var _ref2 = asyncToGenerator(function* ({ idbRequestObject }) {
		let reqObject = {
			mode: idbRequestObject.mode,
			method: idbRequestObject.method,
			redirect: idbRequestObject.redirect,
			headers: new Headers(JSON.parse(idbRequestObject.headers))
		};
		if (idbRequestObject.body) {
			reqObject.body = idbRequestObject.body;
		}
		return new Request(idbRequestObject.url, reqObject);
	});

	return function getFetchableRequest(_x2) {
		return _ref2.apply(this, arguments);
	};
})();

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

function atLeastOne(object) {
  const parameters = Object.keys(object);
  if (!parameters.some(parameter => object[parameter] !== undefined)) {
    throw Error('Please set at least one of the following parameters: ' + parameters.map(p => `'${ p }'`).join(', '));
  }
}

function hasMethod(object, expectedMethod) {
  const parameter = Object.keys(object).pop();
  const type = typeof object[parameter][expectedMethod];
  if (type !== 'function') {
    throw Error(`The '${ parameter }' parameter must be an object that exposes ` + `a '${ expectedMethod }' method.`);
  }
}

function isInstance(object, expectedClass) {
  const parameter = Object.keys(object).pop();
  if (!(object[parameter] instanceof expectedClass)) {
    throw Error(`The '${ parameter }' parameter must be an instance of ` + `'${ expectedClass.name }'`);
  }
}

function isOneOf(object, values) {
  const parameter = Object.keys(object).pop();
  if (!values.includes(object[parameter])) {
    throw Error(`The '${ parameter }' parameter must be set to one of the ` + `following: ${ values }`);
  }
}

function isType(object, expectedType) {
  const parameter = Object.keys(object).pop();
  const actualType = typeof object[parameter];
  if (actualType !== expectedType) {
    throw Error(`The '${ parameter }' parameter has the wrong type. ` + `(Expected: ${ expectedType }, actual: ${ actualType })`);
  }
}

function isSWEnv() {
  return 'ServiceWorkerGlobalScope' in self && self instanceof ServiceWorkerGlobalScope;
}

function isValue(object, expectedValue) {
  const parameter = Object.keys(object).pop();
  const actualValue = object[parameter];
  if (actualValue !== expectedValue) {
    throw Error(`The '${ parameter }' parameter has the wrong value. ` + `(Expected: ${ expectedValue }, actual: ${ actualValue })`);
  }
}

var assert = {
  atLeastOne,
  hasMethod,
  isInstance,
  isOneOf,
  isType,
  isSWEnv,
  isValue
};

let bcmanager;

function broadcastMessage({ type, url }) {
	assert.isType({ type }, 'string');
	assert.isType({ url }, 'string');

	bcmanager && bcmanager.postMessage({
		type: type,
		meta: broadcastMeta,
		payload: {
			url: url
		}
	});
}

let _requestCounter = 0;
let _queueCounter = 0;
/**
 * Core queue class that handles all the enqueue and dequeue
 * as well as cleanup code for the background sync queue
 * @class
 */
class RequestQueue {
	/**
  * Creates an instance of Queue.
  *
  * @memberOf Queue
  */
	constructor({
		config,
		queueName = defaultQueueName + '_' + _queueCounter++,
		idbQDb
	}) {
		this._isQueueNameAddedToAllQueue = false;
		this._queueName = queueName;
		this._config = config;
		this._idbQDb = idbQDb;
		this._queue = [];
		this.initQueue();
	}

	initQueue() {
		var _this = this;

		return asyncToGenerator(function* () {
			const idbQueue = yield _this._idbQDb.get(_this._queueName);
			_this._queue.concat(idbQueue);
		})();
	}

	addQueueNameToAllQueues() {
		var _this2 = this;

		return asyncToGenerator(function* () {
			if (!_this2._isQueueNameAddedToAllQueue) {
				let allQueues = yield _this2._idbQDb.get(allQueuesPlaceholder);
				allQueues = allQueues || [];
				if (!allQueues.includes(_this2._queueName)) {
					allQueues.push(_this2._queueName);
				}
				_this2._idbQDb.put(allQueuesPlaceholder, allQueues);
				_this2._isQueueNameAddedToAllQueue = true;
			}
		})();
	}

	saveQueue() {
		var _this3 = this;

		return asyncToGenerator(function* () {
			yield _this3._idbQDb.put(_this3._queueName, _this3._queue);
		})();
	}

	/**
  * push any request to background sync queue which would be played later
  * preferably when network comes back
  *
  * @param {Request} request request object to be queued by this
  * @param {Object} config optional config to override config params
  *
  * @memberOf Queue
  */
	push({ request }) {
		var _this4 = this;

		return asyncToGenerator(function* () {
			assert.isInstance({ request }, Request);

			const hash = `${ request.url }!${ Date.now() }!${ _requestCounter++ }`;
			const queuableRequest = yield getQueueableRequest({
				request,
				config: _this4._config
			});
			try {
				_this4._queue.push(hash);

				// add to queue
				_this4.saveQueue();
				_this4._idbQDb.put(hash, queuableRequest);
				_this4.addQueueNameToAllQueues();
				// register sync
				self.registration.sync.register(tagNamePrefix + _this4._queueName);

				// broadcast the success of request added to the queue
				broadcastMessage({
					type: broadcastMessageAddedType,
					id: hash,
					url: request.url
				});
			} catch (e) {
				// broadcast the failure of request added to the queue
				broadcastMessage({
					type: broadcastMessageFailedType,
					id: hash,
					url: request.url
				});
			}
		})();
	}

	/**
  * get the Request from the queue at a particular index
  *
  * @param {string} hash hash of the request at the given index
  * @return {Request}
  *
  * @memberOf Queue
  */
	getRequestFromQueue({ hash }) {
		var _this5 = this;

		return asyncToGenerator(function* () {
			assert.isType({ hash }, 'string');

			if (_this5._queue.includes(hash)) {
				return yield _this5._idbQDb.get(hash);
			}
		})();
	}

	get queue() {
		return Object.assign([], this._queue);
	}

	get queueName() {
		return this._queueName;
	}

	get idbQDb() {
		return this._idbQDb;
	}
}

/**
 * Class to handle all the request related
 * transformations, replaying, event handling
 * broadcasting back to controlled pages etc.
 * @class
 */
class RequestManager {
	/**
  * Initializes the request manager
  * stores the callbacks object, maintains config and
  * attaches event handler
  * @param {any} {callbacks, queue}
  *
  * @memberOf RequestManager
  */
	constructor({ callbacks, queue }) {
		assert.isInstance({ queue }, RequestQueue);

		this._globalCallbacks = callbacks || {};
		this._queue = queue;
		this.attachSyncHandler();
	}

	/**
  * attaches sync handler to replay requests when
  * sync event is fired
  *
  * @memberOf RequestManager
  */
	attachSyncHandler() {
		self.addEventListener('sync', event => {
			if (event.tag === tagNamePrefix + this._queue.queueName) {
				event.waitUntil(this.replayRequests());
			}
		});
	}

	/**
  * function to start playing requests
  * in sequence
  * @return {void}
  *
  * @memberOf RequestManager
  */
	replayRequests() {
		var _this = this;

		return this._queue.queue.reduce((promise, hash) => {
			return promise.then((() => {
				var _ref = asyncToGenerator(function* (item) {
					const reqData = yield _this._queue.getRequestFromQueue({ hash });
					if (reqData.response) {
						// check if request is not played already
						return;
					}

					const request = yield getFetchableRequest({
						idbRequestObject: reqData.request
					});

					return fetch(request).then(function (response) {
						if (!response.ok) {
							return Promise.resolve();
						} else {
							// not blocking on putResponse.
							putResponse({
								hash,
								idbObject: reqData,
								response: response.clone(),
								idbQDb: _this._queue.idbQDb
							});
							_this._globalCallbacks.onResponse && _this._globalCallbacks.onResponse(hash, response);
						}
					}).catch(function (err) {
						_this._globalCallbacks.onRetryFailure && _this._globalCallbacks.onRetryFailure(hash, err);
					});
				});

				return function (_x) {
					return _ref.apply(this, arguments);
				};
			})());
		}, Promise.resolve());
	}
}

class BackgroundSyncQueue {
	constructor({ maxRetentionTime = maxAge, callbacks, queueName } = {}) {
		if (queueName) {
			assert.isType({ queueName }, 'string');
		}

		if (maxRetentionTime) {
			assert.isType({ maxRetentionTime }, 'number');
		}

		this._queue = new RequestQueue({
			config: {
				maxAge: maxRetentionTime
			},
			queueName,
			idbQDb: new IDBHelper(getDbName(), 1, 'QueueStore')
		});
		this._requestManager = new RequestManager({ callbacks, queue: this._queue });
	}

	pushIntoQueue({ request }) {
		assert.isInstance({ request }, Request);
		this._queue.push({ request });
	}
}

return BackgroundSyncQueue;

})));

//# sourceMappingURL=background-sync-queue.js.map

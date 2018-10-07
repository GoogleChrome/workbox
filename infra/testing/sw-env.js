/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const sinon = require('sinon');
const serviceWorkerMock = require('service-worker-mock');
const {
  IDBFactory,
  IDBKeyRange,
  IDBDatabase,
  IDBObjectStore,
} = require('shelving-mock-indexeddb');
const URLSearchParams = require('url-search-params');
const Blob = require('./sw-env-mocks/Blob');
const Event = require('./sw-env-mocks/Event');
const {addEventListener, dispatchEvent} = require('./sw-env-mocks/event-listeners');
const ExtendableEvent = require('./sw-env-mocks/ExtendableEvent');
const ExtendableMessageEvent = require('./sw-env-mocks/ExtendableMessageEvent');
const fetch = require('./sw-env-mocks/fetch');
const FetchEvent = require('./sw-env-mocks/FetchEvent');
const FileReader = require('./sw-env-mocks/FileReader');
const Headers = require('./sw-env-mocks/Headers');
const Request = require('./sw-env-mocks/Request');
const Response = require('./sw-env-mocks/Response');
const SyncEvent = require('./sw-env-mocks/SyncEvent');
const SyncManager = require('./sw-env-mocks/SyncManager');
const BroadcastChannel = require('./sw-env-mocks/BroadcastChannel');

// Assign all properties of `self` to `global`;
Object.assign(global, serviceWorkerMock());

// Ensure `self` and `global` are the same object so stubbing works on either.
global.self = global;

// Add/fix globals not in 'service-worker-mock'.
global.addEventListener = addEventListener;
global.Blob = Blob;
global.dispatchEvent = dispatchEvent;
global.Event = Event;
global.ExtendableEvent = ExtendableEvent;
global.ExtendableMessageEvent = ExtendableMessageEvent;
global.fetch = fetch;
global.FetchEvent = FetchEvent;
global.FileReader = FileReader;
global.Headers = Headers;
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;
global.IDBDatabase = IDBDatabase,
global.IDBObjectStore = IDBObjectStore;
global.importScripts = () => {};
global.location = new URL('https://example.com');
global.registration.sync = new SyncManager();
global.Request = Request;
global.Response = Response;
global.SyncEvent = SyncEvent;
global.URLSearchParams = URLSearchParams;
global.BroadcastChannel = BroadcastChannel;

global.navigator = global.navigator || {};
global.navigator.userAgent = global.navigator.userAgent || 'Workbox User Agent';

// TODO: Remove when fixed in service-worker-mock:
// https://github.com/pinterest/service-workers/issues/71
const origMatch = caches.match;
sinon.stub(caches, 'match').callsFake(async (req, options) => {
  if (options && options.cacheName) {
    const cache = await caches.open(options.cacheName);
    return cache.match(req);
  }
  return origMatch(req, options);
});

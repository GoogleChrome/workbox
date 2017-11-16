/*
 Copyright 2017 Google Inc. All Rights Reserved.
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
const fetch = require('./sw-env-mocks/fetch');
const FetchEvent = require('./sw-env-mocks/FetchEvent');
const FileReader = require('./sw-env-mocks/FileReader');
const Headers = require('./sw-env-mocks/Headers');
const Request = require('./sw-env-mocks/Request');
const Response = require('./sw-env-mocks/Response');
const SyncEvent = require('./sw-env-mocks/SyncEvent');
const SyncManager = require('./sw-env-mocks/SyncManager');

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

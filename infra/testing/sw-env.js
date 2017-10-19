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

const serviceWorkerMock = require('service-worker-mock');

// Assign first so other classes can inherit the globals
// Assign all properties of `self` to `global`;
Object.assign(global, serviceWorkerMock());
// Ensure `self` and `global` are the same object so stubbing works on either.
global.self = global;

const {IDBFactory, IDBKeyRange} = require('shelving-mock-indexeddb');
const Blob = require('./sw-env-mocks/Blob');
const Event = require('./sw-env-mocks/Event');
const {addEventListener, dispatchEvent} = require('./sw-env-mocks/event-listeners');
const fetch = require('./sw-env-mocks/fetch');
const FetchEvent = require('./sw-env-mocks/FetchEvent');
const Request = require('./sw-env-mocks/Request');
const SyncEvent = require('./sw-env-mocks/SyncEvent');
const SyncManager = require('./sw-env-mocks/SyncManager');

// Add/fix globals not in 'service-worker-mock'.
global.addEventListener = addEventListener;
global.Blob = Blob;
global.dispatchEvent = dispatchEvent;
global.Event = Event;
global.fetch = fetch;
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;
global.importScripts = () => {};
global.location = 'https://example.com';
global.registration.sync = new SyncManager();
global.SyncEvent = SyncEvent;

// Because we override Request, we can use the serivce-worker-mock because it
// checks for type of Request, that will no longer match in our tests.
// We need to use Request until https://github.com/pinterest/service-workers/issues/65
global.Request = Request;
global.FetchEvent = FetchEvent;

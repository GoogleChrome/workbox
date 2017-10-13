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
const {IDBFactory, IDBKeyRange} = require('shelving-mock-indexeddb');
const Blob = require('./sw-env-mocks/Blob');
const Event = require('./sw-env-mocks/Event');
const {addEventListener, dispatchEvent} = require('./sw-env-mocks/event-listeners');
const ExtendableEvent = require('./sw-env-mocks/ExtendableEvent');
const fetch = require('./sw-env-mocks/fetch');
const Headers = require('./sw-env-mocks/Headers');
const Request = require('./sw-env-mocks/Request');
const SyncEvent = require('./sw-env-mocks/SyncEvent');
const SyncManager = require('./sw-env-mocks/SyncManager');

// Assign all properties of `self` to `global`;
Object.assign(global, serviceWorkerMock());
global.self = global;

// Add/fix globals not in 'service-worker-mock'.
global.addEventListener = addEventListener;
global.Blob = Blob;
global.dispatchEvent = dispatchEvent;
global.Event = Event;
global.ExtendableEvent = ExtendableEvent;
global.fetch = fetch;
global.Headers = Headers;
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;
global.importScripts = () => {};
global.location = 'https://example.com';
global.registration.sync = new SyncManager();
global.Request = Request;
global.SyncEvent = SyncEvent;

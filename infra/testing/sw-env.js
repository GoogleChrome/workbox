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

const {IDBFactory, IDBKeyRange} = require('shelving-mock-indexeddb');
const makeServiceWorkerEnv = require('service-worker-mock');
const mockFetch = require('./mock-fetch');

Object.assign(global, makeServiceWorkerEnv());
global.self = global;

global.fetch = mockFetch;
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;

// Stub missing/broken Headers API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#headers-class
class Headers {
  constructor(obj = {}) {
    this.obj = obj;
  }

  get(key) {
    return this.obj[key];
  }

  set(key, value) {
    this.obj[key] = value;
  }

  entries() {
    return Object.entries(this.obj);
  }

  // TODO: implement append() and [Symbol.iterator]()
}
global.Headers = Headers;

// Stub missing/broken Request API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#request-class
class Request {
  constructor(url, options = {}) {
    if (url instanceof Request) {
      options = url;
      url = options.url;
    }

    if (!url) {
      throw new TypeError(`Invalid url: ${url}`);
    }

    this.url = url;
    this.method = options.method || 'GET';
    this.mode = options.mode || 'cors';
    this.headers = new Headers(options.headers);

    // TODO(philipwalton): support non-text bodies.
    this._body = new Blob([options.body]);
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError(`Failed to execute 'clone' on 'Request': ` +
          `Request body is already used`);
    } else {
      return new Request(this.url, Object.assign({body: this._body}, this));
    }
  }

  async blob() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;
      return new Blob([this._body]);
    }
  }

  async text() {
    if (this.bodyUsed) {
      throw new TypeError('Already read');
    } else {
      this.bodyUsed = true;
      // Limitionation: this assumes the stored Blob is text-based.
      return this._body._text;
    }
  }
}
global.Request = Request;


// Event
// https://dom.spec.whatwg.org/#event
class Event {
  constructor(type, eventInitDict = {}) {
    this.type = type;

    this.bubbles = eventInitDict.bubbles || false;
    this.cancelable = eventInitDict.cancelable || false;
    this.composed = eventInitDict.composed || false;
  }
}
global.Event = Event;

// ExtendibleEvent
// https://www.w3.org/TR/service-workers-1/#extendable-event
class ExtendableEvent extends Event {
  waitUntil(/* promise */) {
    // TODO(philipwalton): keep track of the promises added to each event
    // and expose them in some way so tests can assert logic doesn't run
    // after all ExtendableEvents have settled.
  }
}
global.ExtendableEvent = ExtendableEvent;

// SyncEvent
// https://wicg.github.io/BackgroundSync/spec/#sync-event
class SyncEvent extends ExtendableEvent {
  constructor(type, init = {}) {
    super(type, init);

    if (!init.tag) {
      throw new TypeError(
          `Failed to construct 'SyncEvent': required member tag is undefined.`);
    }

    this.tag = init.tag;
    this.lastChance = init.lastChance || false;
  }
}
global.SyncEvent = SyncEvent;

// Fix incorrect addEventListener stub
let listenerMap = new Map();

global.addEventListener = (type, listener /* TODO: support `opts` */) => {
  if (listenerMap.has(type)) {
    listenerMap.get(type).add(listener);
  } else {
    listenerMap.set(type, new Set([listener]));
  }
};

// dispatchEvent
global.dispatchEvent = (event) => {
  for (const listener of listenerMap.get(event.type)) {
    listener(event);
  }
};

global.__removeAllEventListeners = () => {
  listenerMap = new Map();
};

// SyncManager
// https://wicg.github.io/BackgroundSync/spec/#sync-manager-interface
class SyncManager {
  constructor() {
    this._tagList = new Set();
  }
  async register(tagName) {
    this._tagList.add(tagName);
    return Promise.resolve();
  }
  async getTags() {
    return Promise.resolve([...this._tagList]);
  }
}
global.registration.sync = new SyncManager();

// Blob
// https://w3c.github.io/FileAPI/#dom-blob-blob
class Blob {
  constructor(blobParts, options = {}) {
    if (typeof blobParts === 'undefined') {
      blobParts = [];
    }
    if (!Array.isArray(blobParts)) {
      throw new TypeError(`Failed to construct 'Blob': ` +
          `The provided value cannot be converted to a sequence.`);
    }

    this._parts = blobParts;
    this._type = options.type || '';
  }

  get size() {
    let size = 0;
    for (const part of this._parts) {
      size += part.length || part.size;
    }
    return size;
  }

  get type() {
    return this._type;
  }

  // Warning: non-standard, but used in other mocks for simplicity.
  // TODO(philipwalton): implement/use FileReader to get the Blob text.
  get _text() {
    let text = '';
    for (const part of this._parts) {
      text += typeof part === 'string' ? part : part._text;
    }
    return text;
  }
}
global.Blob = Blob;

// This is needed to ensure new URL('/', location), works.
global.location = 'https://example.com';


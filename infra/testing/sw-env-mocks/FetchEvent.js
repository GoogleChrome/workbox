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


const ExtendableEvent = require('./ExtendableEvent');

// FetchEvent
// https://www.w3.org/TR/service-workers-1/#fetch-event-section
class FetchEvent extends ExtendableEvent {
  constructor(type, init = {}) {
    super(type, init);

    if (!init.request) {
      throw new TypeError(`Failed to construct 'FetchEvent': ` +
          `Missing required member(s): request.`);
    }

    this.request = init.request;
    this.clientId = init.clientId || null;
    this.isReload = init.isReload || false;
  }

  respondWith(promise) {
    // TODO
  }
}

module.exports = FetchEvent;

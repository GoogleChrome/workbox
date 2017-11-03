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


const Event = require('./Event');
const {_allExtendableEvents} = require('./event-listeners');


// ExtendableEvent
// https://www.w3.org/TR/service-workers-1/#extendable-event
class ExtendableEvent extends Event {
  constructor(...args) {
    super(...args);

    // https://www.w3.org/TR/service-workers-1/#dfn-extend-lifetime-promises
    this._extendLifetimePromises = new Set();

    // Used to keep track of all ExtendableEvent instances.
    _allExtendableEvents.add(this);
  }

  waitUntil(promise) {
    this._extendLifetimePromises.add(promise);
  }
}

module.exports = ExtendableEvent;

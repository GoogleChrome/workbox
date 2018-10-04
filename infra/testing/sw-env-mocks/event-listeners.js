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

let _listenerMap = new Map();
let _allExtendableEvents = new Set();

const addEventListener = (type, listener /* TODO: support `opts` */) => {
  if (_listenerMap.has(type)) {
    _listenerMap.get(type).add(listener);
  } else {
    _listenerMap.set(type, new Set([listener]));
  }
};

const dispatchEvent = (event) => {
  const listeners = _listenerMap.get(event.type);

  if (listeners) {
    for (const listener of listeners) {
      listener(event);
    }
  }
};

const resetEventListeners = () => {
  _listenerMap.clear();
  _allExtendableEvents.clear();
};

const eventsDoneWaiting = () => {
  const allExtendLifetimePromises = [];

  // Create a single list of _extendLifetimePromises values in all events.
  // Also add `catch` handlers to each promise so all of them are run, rather
  // that the normal behavior `Promise.all` erroring at the first error.
  for (const event of _allExtendableEvents) {
    const extendLifetimePromisesOrErrors = [...event._extendLifetimePromises]
      .map((promise) => promise.catch((err) => err));

    allExtendLifetimePromises.push(...extendLifetimePromisesOrErrors);
  }

  return Promise.all(allExtendLifetimePromises);
};

module.exports = {
  addEventListener,
  dispatchEvent,
  resetEventListeners,
  eventsDoneWaiting,
  _listenerMap,
  _allExtendableEvents,
};

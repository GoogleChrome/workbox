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

let listenerMap = new Map();


const addEventListener = (type, listener /* TODO: support `opts` */) => {
  if (listenerMap.has(type)) {
    listenerMap.get(type).add(listener);
  } else {
    listenerMap.set(type, new Set([listener]));
  }
};


const dispatchEvent = (event) => {
  const listeners = listenerMap.get(event.type);

  if (listeners) {
    for (const listener of listeners) {
      listener(event);
    }
  }
};

const resetEventListeners = () => listenerMap = new Map();


module.exports = {
  addEventListener,
  dispatchEvent,
  resetEventListeners,
};

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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

module.exports = Event;

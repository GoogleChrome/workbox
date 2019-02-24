/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ExtendableEvent = require('./ExtendableEvent');


// ExtendableMessageEvent
// https://w3c.github.io/ServiceWorker/#extendablemessageevent-interface
class ExtendableMessageEvent extends ExtendableEvent {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);

    this.data = eventInitDict.data || null;
  }
}

module.exports = ExtendableMessageEvent;

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ExtendableEvent = require('./ExtendableEvent');

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
module.exports = SyncEvent;

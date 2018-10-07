const ExtendableEvent = require('./ExtendableEvent');


// ExtendableMessageEvent
// https://w3c.github.io/ServiceWorker/#extendablemessageevent-interface
class ExtendableMessageEvent extends ExtendableEvent {
  constructor(type, eventInitDict) {
    super(type, eventInitDict);

    this.data = eventInitDict.data || null;
  }
}

module.exports = ExtendableMessageEvent;

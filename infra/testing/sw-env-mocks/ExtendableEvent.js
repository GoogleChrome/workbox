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

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

module.exports = class BroadcastChannel {
  constructor(channelName) {
    this.name = channelName;
  }

  postMessage(msgDetails) {
    // NOOP
  }
};

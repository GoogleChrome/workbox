// Stub missing/broken Headers API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#headers-class
class Headers {
  constructor(init = {}) {
    if (init instanceof Headers) {
      this.obj = Object.assign({}, init.obj);
    } else {
      this.obj = Object.assign({}, init);
    }
  }

  has(key) {
    return (key in this.obj);
  }

  get(key) {
    return this.has(key) ? this.obj[key] : null;
  }

  set(key, value) {
    this.obj[key] = value;
  }

  entries() {
    return Object.entries(this.obj);
  }

  // TODO: implement append() and [Symbol.iterator]()

  forEach(cb) {
    Object.keys(this.obj).forEach((key) => {
      cb(this.obj[key], key);
    });
  }
}

module.exports = Headers;

importScripts('/__WORKBOX/buildFile/workbox-sw');

// This is expected to lead to an error.
const module = self.workbox['does-not-exist'];
if (!module) {
  throw new Error(`self.workbox.${namespace} did not load the expected interface.`);
}

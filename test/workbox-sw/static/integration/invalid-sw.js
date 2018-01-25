importScripts('/__WORKBOX/buildFile/workbox-sw');

// This is expected to lead to an error.
const namespace = 'doesnotexist';
const module = self.workbox[namespace];
if (!module) {
  throw new Error(`self.workbox.${namespace} did not load anything.`);
}

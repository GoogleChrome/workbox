/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-sw');
importScripts('/infra/testing/comlink/sw-interface.js');

workbox.setConfig({modulePathPrefix: '/__WORKBOX/buildFile/'});

// This is expected to lead to an error.
const namespace = 'doesnotexist';
const module = self.workbox[namespace];
if (!module) {
  throw new Error(`self.workbox.${namespace} did not load anything.`);
}

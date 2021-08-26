/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('../../../packages/workbox-sw/build/browser/workbox-sw.js');

const wb = new self.WorkboxSW({
  modulePathCb: (moduleName, debug) => {
    const build = debug ? 'dev' : 'prod';
    return `../../../packages/${moduleName}/build/browser/${moduleName}.${build}.js`;
  },
});

wb.skipWaiting();
wb.clientsClaim();

wb.core.setLogLevel(self.workbox.core.LOG_LEVELS.debug);

wb.precaching.precache(['example.css', 'example.js']);

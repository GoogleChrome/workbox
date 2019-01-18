/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// {{ version }}

addEventListener('install', (event) => event.waitUntil(skipWaiting()));
addEventListener('activate', (event) => event.waitUntil(clients.claim()));

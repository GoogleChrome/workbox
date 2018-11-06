/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

addEventListener('message', async (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    skipWaiting();
  }
});

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {registerQuotaErrorCallback} from 'workbox-core/registerQuotaErrorCallback.mjs';

describe(`registerQuotaErrorCallback()`, function () {
  it(`should throw when passed a non-function in dev mode`, async function () {
    if (process.env.NODE_ENV === 'production') this.skip();

    await expectError(() => registerQuotaErrorCallback(null), 'incorrect-type');
  });
});

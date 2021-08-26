/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheOkAndOpaquePlugin} from 'workbox-strategies/plugins/cacheOkAndOpaquePlugin.mjs';
import {generateOpaqueResponse} from '../../../../infra/testing/helpers/generateOpaqueResponse.mjs';
import {generateUniqueResponse} from '../../../../infra/testing/helpers/generateUniqueResponse.mjs';

describe(`cacheOkAndOpaquePlugin`, function () {
  for (const status of [206, 404]) {
    it(`should return null when status is ${status}`, async function () {
      const response = generateUniqueResponse({status});
      expect(await cacheOkAndOpaquePlugin.cacheWillUpdate({response})).to.equal(
        null,
      );
    });
  }

  it(`should return Response if status is opaque`, async function () {
    const response = await generateOpaqueResponse();
    expect(await cacheOkAndOpaquePlugin.cacheWillUpdate({response})).to.equal(
      response,
    );
  });

  it(`should return Response if status is 200`, async function () {
    const response = generateUniqueResponse();
    expect(await cacheOkAndOpaquePlugin.cacheWillUpdate({response})).to.equal(
      response,
    );
  });
});

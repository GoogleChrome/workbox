/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {waitUntil} from 'workbox-core/_private/waitUntil.mjs';
import {spyOnEvent} from '../../../../infra/testing/helpers/extendable-event-utils.mjs';

describe(`waitUntil()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
  });

  after(async function () {
    sandbox.restore();
  });

  it(`adds an async function's returned promise to an event and returns it`, async function () {
    const event = new ExtendableEvent('install');
    spyOnEvent(event);

    const promise = new Promise((resolve) => resolve('test'));
    const result = await waitUntil(event, () => promise);

    expect(result).to.equal('test');
    expect(event.waitUntil.args[0][0]).to.equal(promise);
  });
});

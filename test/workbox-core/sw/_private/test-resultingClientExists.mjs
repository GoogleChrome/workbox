/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {resultingClientExists} from 'workbox-core/_private/resultingClientExists.mjs';

describe(`resultingClientExists()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    sandbox.restore();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`should resolve to a matching window client ID`, async function () {
    sandbox
      .stub(clients, 'matchAll')
      .onFirstCall()
      .resolves([{id: '1'}, {id: '2'}])
      .onSecondCall()
      .resolves([{id: '1'}, {id: '2'}])
      .onThirdCall()
      .resolves([{id: '1'}, {id: '3'}]);

    const win = await resultingClientExists('3');
    expect(win.id).to.equal('3');
  });

  it(`should resolve to undefined when not passed a value`, async function () {
    sandbox
      .stub(clients, 'matchAll')
      .onFirstCall()
      .resolves([{id: '1'}, {id: '2'}])
      .onSecondCall()
      .resolves([{id: '1'}, {id: '2'}])
      .onThirdCall()
      .resolves([{id: '1'}, {id: '3'}]);

    const startTime = performance.now();
    const win = await resultingClientExists();

    expect(win).to.equal(undefined);
    expect(performance.now() - startTime).to.be.below(2000);
  });

  it(`should resolve to undefined after 2 seconds of unsuccessful retrying`, async function () {
    sandbox.stub(clients, 'matchAll').resolves([{id: '1'}, {id: '2'}]);

    const startTime = performance.now();
    const win = await resultingClientExists('3');

    expect(win).to.equal(undefined);
    expect(performance.now() - startTime).to.be.above(2000);
  });
});

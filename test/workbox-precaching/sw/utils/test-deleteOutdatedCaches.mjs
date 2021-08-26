/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {deleteOutdatedCaches} from 'workbox-precaching/utils/deleteOutdatedCaches.mjs';

describe(`deleteOutdatedCaches()`, function () {
  const CACHE_NAME = 'expected-precache-name';

  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  after(function () {
    sandbox.restore();
  });

  it(`should not do anything when there are no caches`, async function () {
    sandbox.stub(caches, 'keys').resolves([]);
    const cachesDeleteStub = sandbox.stub(caches, 'delete').resolves();

    const cachesDeleted = await deleteOutdatedCaches(CACHE_NAME);

    expect(cachesDeleted).to.be.empty;
    expect(cachesDeleteStub.notCalled).to.be.true;
  });

  it(`should not do anything when there is only the expected cache`, async function () {
    sandbox.stub(caches, 'keys').resolves([CACHE_NAME]);
    const cachesDeleteStub = sandbox.stub(caches, 'delete').resolves();

    const cachesDeleted = await deleteOutdatedCaches(CACHE_NAME);

    expect(cachesDeleted).to.be.empty;
    expect(cachesDeleteStub.notCalled).to.be.true;
  });

  it(`should delete everything that matches the deletion criteria`, async function () {
    sandbox
      .stub(caches, 'keys')
      .resolves([
        CACHE_NAME,
        `this-precache-should-be-deleted1-${self.registration.scope}`,
        `this-precache-should-be-deleted2-${self.registration.scope}`,
      ]);
    const cachesDeleteStub = sandbox.stub(caches, 'delete').resolves();

    const cachesDeleted = await deleteOutdatedCaches(CACHE_NAME);

    expect(cachesDeleted).to.have.members([
      `this-precache-should-be-deleted1-${self.registration.scope}`,
      `this-precache-should-be-deleted2-${self.registration.scope}`,
    ]);
    expect(cachesDeleteStub.calledTwice).to.be.true;
    expect(cachesDeleteStub.firstCall.args).to.eql([
      `this-precache-should-be-deleted1-${self.registration.scope}`,
    ]);
    expect(cachesDeleteStub.secondCall.args).to.eql([
      `this-precache-should-be-deleted2-${self.registration.scope}`,
    ]);
  });

  it(`should take SW scope into consideration as part of the criteria`, async function () {
    sandbox
      .stub(caches, 'keys')
      .resolves([
        CACHE_NAME,
        `this-precache-should-not-be-deleted-no-scope-match`,
        `this-precache-should-be-deleted-${self.registration.scope}`,
      ]);
    const cachesDeleteStub = sandbox.stub(caches, 'delete').resolves();

    const cachesDeleted = await deleteOutdatedCaches(CACHE_NAME);

    expect(cachesDeleted).to.have.members([
      `this-precache-should-be-deleted-${self.registration.scope}`,
    ]);
    expect(cachesDeleteStub.calledOnce).to.be.true;
    expect(cachesDeleteStub.firstCall.args).to.eql([
      `this-precache-should-be-deleted-${self.registration.scope}`,
    ]);
  });

  it(`should support overriding the default '-precache-' substring criteria`, async function () {
    sandbox
      .stub(caches, 'keys')
      .resolves([
        CACHE_NAME,
        `this-precache-should-not-be-deleted-${self.registration.scope}`,
        `this-PRECACHE-should-be-deleted1-${self.registration.scope}`,
        `this-PRECACHE-should-be-deleted2-${self.registration.scope}`,
      ]);
    const cachesDeleteStub = sandbox.stub(caches, 'delete').resolves();

    const cachesDeleted = await deleteOutdatedCaches(CACHE_NAME, '-PRECACHE-');

    expect(cachesDeleted).to.have.members([
      `this-PRECACHE-should-be-deleted1-${self.registration.scope}`,
      `this-PRECACHE-should-be-deleted2-${self.registration.scope}`,
    ]);
    expect(cachesDeleteStub.calledTwice).to.be.true;
    expect(cachesDeleteStub.firstCall.args).to.eql([
      `this-PRECACHE-should-be-deleted1-${self.registration.scope}`,
    ]);
    expect(cachesDeleteStub.secondCall.args).to.eql([
      `this-PRECACHE-should-be-deleted2-${self.registration.scope}`,
    ]);
  });
});

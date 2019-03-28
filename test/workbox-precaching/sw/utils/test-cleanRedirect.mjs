/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cleanRedirect} from 'workbox-precaching/utils/cleanRedirect.mjs';


describe(`cleanRedirect()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it(`should use blob() when there is no 'body' stream in the response`, async function() {
    const response = new Response('Response text');
    sandbox.spy(response, 'blob');

    const cleanedResponse = await cleanRedirect(response);
    const cleanedResponseBody = await cleanedResponse.text();
    expect(cleanedResponseBody).to.equal('Response text');

    if (!response.body) {
      expect(response.blob.callCount).to.equal(1);
    } else {
      expect(response.blob.callCount).to.equal(0);
    }
  });

  it(`should use the statusText, status, and headers from the original response`, async function() {
    const headers = {
      'x-test': 1,
    };
    const statusText = 'Non-Authoritative';
    const status = 203;

    const response = new Response('', {headers, statusText, status});
    const clonedResponse = await cleanRedirect(response);

    expect(response.headers).to.eql(clonedResponse.headers);
    expect(response.status).to.eql(clonedResponse.status);
    expect(response.statusText).to.eql(clonedResponse.statusText);
  });
});

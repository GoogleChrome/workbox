import sinon from 'sinon';
import {expect} from 'chai';

import cleanRedirect from '../../../../packages/workbox-precaching/utils/cleanRedirect.mjs';

describe(`[workbox-precaching] cleanRedirect()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  it(`should use blob() when there is no 'body' stream in the response`, async function() {
    const response = new Response('Original Response');
    sandbox.stub(response, 'clone').callsFake(() => {
      const newResponse = new Response('Repeated Response');
      delete newResponse.body;
      newResponse.blob = () => {
        return Promise.resolve('Blob Body');
      };
      return newResponse;
    });

    const cleanedResponse = await cleanRedirect(response);
    const cleanedResponseBody = await cleanedResponse.text();
    expect(cleanedResponseBody).to.equal('Blob Body');
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

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
});

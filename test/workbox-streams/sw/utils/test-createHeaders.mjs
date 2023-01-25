/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {createHeaders} from 'workbox-streams/utils/createHeaders.mjs';

describe(`createHeaders`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  afterEach(function () {
    sandbox.restore();
  });

  const DEFAULT_CONTENT_TYPE = ['content-type', 'text/html'];

  it(`should use the default Content-Type, and construct with an empty object, when headersInit is undefined`, function () {
    const headersSpy = sandbox.spy(self, 'Headers');
    const headers = createHeaders();
    expect([...headers]).to.eql([DEFAULT_CONTENT_TYPE]);
    expect(headersSpy.calledOnce).to.be.true;
    // See https://github.com/GoogleChrome/workbox/issues/1461
    expect(headersSpy.args[0][0]).to.eql({});
  });

  it(`should use the default Content-Type along with custom headersInit values`, function () {
    const headersInit = {
      'x-one': '1',
      'x-two': '2',
    };
    const headers = createHeaders(headersInit);

    expect([...headers]).to.eql([
      DEFAULT_CONTENT_TYPE,
      ...Object.entries(headersInit),
    ]);
  });

  it(`should use a custom Content-Type`, function () {
    const headersInit = {
      'content-type': 'text/plain',
    };
    const headers = createHeaders(headersInit);
    expect([...headers]).to.eql(Object.entries(headersInit));
  });
});

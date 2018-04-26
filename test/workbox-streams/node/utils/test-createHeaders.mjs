import {expect} from 'chai';

import {createHeaders} from '../../../../packages/workbox-streams/utils/createHeaders.mjs';

describe(`[workbox-streams] utils/createHeaders`, function() {
  const DEFAULT_CONTENT_TYPE = ['content-type', 'text/html'];

  it(`should use the default Content-Type when headersInit is undefined`, function() {
    const headers = createHeaders();
    expect(headers.entries()).to.eql([
      DEFAULT_CONTENT_TYPE,
    ]);
  });

  it(`should use the default Content-Type along with custom headersInit values`, function() {
    const headersInit = {
      'x-one': '1',
      'x-two': '2',
    };
    const headers = createHeaders(headersInit);
    expect(headers.entries()).to.eql([
      ...Object.entries(headersInit),
      DEFAULT_CONTENT_TYPE,
    ]);
  });

  it(`should use a custom Content-Type`, function() {
    const headersInit = {
      'content-type': 'text/plain',
    };
    const headers = createHeaders(headersInit);
    expect(headers.entries()).to.eql(Object.entries(headersInit));
  });
});

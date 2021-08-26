/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {copyResponse} from 'workbox-core/copyResponse.mjs';

describe(`copyResponse`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  afterEach(function () {
    sandbox.restore();
  });

  // In some browsers this is '' (Chrome) and in some it's 'OK' (Edge 18).
  const defaultStatusText = new Response().statusText;

  const makeResponse = (url) => {
    const body = new Blob(['console.log()'], {type: 'text/javascript'});
    const response = new Response(body, {headers: {'X-One': '1'}});

    // Default to a "real" same-origin URL, unless there's one passed in.
    if (url === undefined) {
      url = new URL('/app.js', self.location.origin).href;
    }
    sandbox.replaceGetter(response, 'url', () => url);

    return response;
  };

  it(`should throw the expected exception when passed a cross-origin response`, async function () {
    const crossOriginResponse = makeResponse('https://cross-origin.com/app.js');
    await expectError(
      () => copyResponse(crossOriginResponse),
      'cross-origin-copy-response',
    );
  });

  it(`should throw the expected exception when passed an opaque response`, async function () {
    const opaqueResponse = makeResponse('');
    await expectError(
      () => copyResponse(opaqueResponse),
      'cross-origin-copy-response',
    );
  });

  it(`should allow modifying a response via the modifier return value`, async function () {
    const oldResponse = makeResponse();
    const newResponse1 = await copyResponse(oldResponse, (init) => {
      // Test modifying the existing headers.
      init.headers.set('Content-Type', 'text/plain');
      init.headers.set('X-Two', '2');
      init.headers.append('X-One', 'another');
      init.status = 203;
      init.statusText = 'Really?';

      return init;
    });

    expect(newResponse1.headers.get('Content-Type')).to.equal('text/plain');
    expect(newResponse1.headers.get('X-One')).to.equal('1, another');
    expect(newResponse1.headers.get('X-Two')).to.equal('2');
    expect(newResponse1.status).to.equal(203);
    expect(newResponse1.statusText).to.equal('Really?');
    expect(await newResponse1.text()).to.equal('console.log()');

    const newResponse2 = await copyResponse(oldResponse, (init) => {
      // Test setting an object.
      init.headers = {'X-Two': '2'};

      return init;
    });

    // The `Content-Type` header comes from the body.
    expect(newResponse2.headers.get('Content-Type')).to.equal(
      'text/javascript',
    );
    expect(newResponse2.headers.get('X-One')).to.equal(null);
    expect(newResponse2.headers.get('X-Two')).to.equal('2');
    expect(newResponse2.status).to.equal(200);
    expect(newResponse2.statusText).to.equal(defaultStatusText);
    expect(await newResponse2.text()).to.equal('console.log()');

    const newResponse3 = await copyResponse(oldResponse, (init) => {
      // Test return an entirely new object
      return {
        headers: {'X-Two': '2', 'X-Three': '3'},
      };
    });

    // The `Content-Type` header comes from the body.
    expect(newResponse3.headers.get('Content-Type')).to.equal(
      'text/javascript',
    );
    expect(newResponse3.headers.get('X-One')).to.equal(null);
    expect(newResponse3.headers.get('X-Two')).to.equal('2');
    expect(newResponse3.headers.get('X-Three')).to.equal('3');
    expect(newResponse3.status).to.equal(200);
    expect(newResponse3.statusText).to.equal(defaultStatusText);
    expect(await newResponse3.text()).to.equal('console.log()');
  });

  it(`should copy a response as-is when no modifier is passed`, async function () {
    const oldResponse = makeResponse();
    const newResponse = await copyResponse(oldResponse);

    expect(newResponse.headers.get('X-One')).to.equal('1');
    expect(newResponse.headers.get('content-type')).to.equal('text/javascript');
    expect(newResponse.status).to.equal(200);
    expect(newResponse.statusText).to.equal(defaultStatusText);
    expect(await newResponse.text()).to.equal('console.log()');
  });
});
